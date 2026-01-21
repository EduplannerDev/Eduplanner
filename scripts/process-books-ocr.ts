/**
 * Script para procesar libros descargados usando Google Vision API (OCR)
 * 
 * Este script:
 * 1. Lee las imágenes descargadas de cada libro
 * 2. Las procesa con Google Vision API para extraer el texto
 * 3. Guarda el texto extraído en archivos JSON estructurados
 * 
 * Requiere:
 *   - Google Cloud Vision API habilitada
 *   - Variable de entorno: GOOGLE_CLOUD_VISION_API_KEY
 * 
 * Uso:
 *   npx tsx scripts/process-books-ocr.ts [--libro=P1PCA] [--test]
 * 
 * Opciones:
 *   --libro: Procesar solo un libro específico
 *   --test: Modo de prueba (solo procesa primeras 5 páginas)
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { catalogoLibrosSEP, type LibroSEP } from '../lib/catalogo-libros-sep';


const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads', 'sep-books');
const OUTPUT_DIR = path.join(process.cwd(), 'downloads', 'sep-books-ocr');
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;

// Batch size para Google Vision (máximo 16 imágenes por request)
const BATCH_SIZE = 10;

// Rate limiting (requests por minuto)
const MAX_REQUESTS_PER_MINUTE = 60;
const REQUEST_DELAY = (60 * 1000) / MAX_REQUESTS_PER_MINUTE;

interface PaginaOCR {
    numeroPagina: number;
    textoExtraido: string;
    confianza: number;
    idioma: string;
    timestamp: string;
}

interface LibroOCR {
    libro: LibroSEP & { totalPaginas: number };
    paginas: PaginaOCR[];
    estadisticas: {
        totalPaginas: number;
        paginasProcesadas: number;
        confianzaPromedio: number;
        palabrasTotales: number;
    };
}

interface OCRStats {
    totalLibros: number;
    librosCompletados: number;
    totalPaginas: number;
    paginasProcesadas: number;
    errores: Array<{ libro: string; pagina: number; error: string }>;
    costosEstimados: {
        totalImagenes: number;
        costoUSD: number;
    };
}

const stats: OCRStats = {
    totalLibros: 0,
    librosCompletados: 0,
    totalPaginas: 0,
    paginasProcesadas: 0,
    errores: [],
    costosEstimados: {
        totalImagenes: 0,
        costoUSD: 0,
    },
};

/**
 * Procesa una imagen con Google Vision API
 */
async function procesarImagenConVision(imagePath: string): Promise<{ texto: string; confianza: number }> {
    if (!GOOGLE_VISION_API_KEY) {
        throw new Error('GOOGLE_CLOUD_VISION_API_KEY no está configurada');
    }

    try {
        // Leer imagen y convertir a base64
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Llamada a Google Vision API
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [
                        {
                            image: {
                                content: base64Image,
                            },
                            features: [
                                {
                                    type: 'DOCUMENT_TEXT_DETECTION',
                                    maxResults: 1,
                                },
                            ],
                            imageContext: {
                                languageHints: ['es'], // Español
                            },
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // Incrementar contador de costos
        stats.costosEstimados.totalImagenes++;
        stats.costosEstimados.costoUSD = stats.costosEstimados.totalImagenes * 0.0015;

        const annotation = result.responses[0].fullTextAnnotation;
        if (!annotation) {
            return { texto: '', confianza: 0 };
        }

        // Calcular confianza promedio
        const words = annotation.pages?.[0]?.blocks?.flatMap((block: any) =>
            block.paragraphs?.flatMap((para: any) =>
                para.words?.map((word: any) => word.confidence || 0) || []
            ) || []
        ) || [];

        const confianzaPromedio = words.length > 0
            ? words.reduce((sum: number, conf: number) => sum + conf, 0) / words.length
            : 0;

        return {
            texto: annotation.text || '',
            confianza: confianzaPromedio,
        };
    } catch (error) {
        console.error(`Error procesando imagen ${imagePath}:`, error);
        throw error;
    }
}

/**
 * Procesa todas las páginas de un libro
 */
async function procesarLibro(libro: LibroSEP, testMode: boolean = false): Promise<void> {
    console.log(`\n📚 Procesando OCR: ${libro.nombre} (${libro.grado} ${libro.nivel})`);
    console.log(`   Código: ${libro.codigo}`);

    // Leer metadata del libro descargado
    const libroDir = path.join(DOWNLOADS_DIR, libro.cicloEscolar, libro.codigo);
    const metadataPath = path.join(libroDir, 'metadata.json');

    let totalPaginas: number;
    try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);
        totalPaginas = metadata.totalPaginas;
    } catch (error) {
        console.error(`   ❌ No se pudo leer metadata.json`);
        stats.errores.push({ libro: libro.codigo, pagina: 0, error: 'Metadata no encontrada' });
        return;
    }

    const paginasAProcesar = testMode ? Math.min(5, totalPaginas) : totalPaginas;
    console.log(`   Total de páginas: ${totalPaginas}${testMode ? ' (modo test: solo 5)' : ''}`);

    stats.totalPaginas += paginasAProcesar;

    // Crear directorio de salida
    const outputDir = path.join(OUTPUT_DIR, libro.cicloEscolar, libro.codigo);
    await fs.mkdir(outputDir, { recursive: true });

    const paginasOCR: PaginaOCR[] = [];

    // Procesar páginas en batches
    for (let i = 1; i <= paginasAProcesar; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, paginasAProcesar + 1);
        const batchPromises = [];

        for (let j = i; j < batchEnd; j++) {
            const pageNumber = String(j).padStart(3, '0');
            const imagePath = path.join(libroDir, `${pageNumber}.jpg`);

            // Verificar si ya fue procesada
            const ocrCachePath = path.join(outputDir, `page_${pageNumber}.json`);
            try {
                const cachedContent = await fs.readFile(ocrCachePath, 'utf-8');
                const cached: PaginaOCR = JSON.parse(cachedContent);
                paginasOCR.push(cached);
                stats.paginasProcesadas++;
                process.stdout.write(`\r   Procesando: ${stats.paginasProcesadas}/${paginasAProcesar} páginas (cache)`);
                continue;
            } catch {
                // No existe en cache, procesar
            }

            batchPromises.push(
                (async () => {
                    try {
                        const { texto, confianza } = await procesarImagenConVision(imagePath);

                        const paginaOCR: PaginaOCR = {
                            numeroPagina: j,
                            textoExtraido: texto,
                            confianza,
                            idioma: 'es',
                            timestamp: new Date().toISOString(),
                        };

                        paginasOCR.push(paginaOCR);
                        stats.paginasProcesadas++;

                        // Guardar en cache
                        await fs.writeFile(ocrCachePath, JSON.stringify(paginaOCR, null, 2));

                        process.stdout.write(`\r   Procesando: ${stats.paginasProcesadas}/${paginasAProcesar} páginas`);

                        // Rate limiting delay
                        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
                    } catch (error) {
                        stats.errores.push({
                            libro: libro.codigo,
                            pagina: j,
                            error: error instanceof Error ? error.message : 'Error desconocido',
                        });
                    }
                })()
            );
        }

        await Promise.all(batchPromises);
    }

    // Ordenar páginas por número
    paginasOCR.sort((a, b) => a.numeroPagina - b.numeroPagina);

    // Calcular estadísticas
    const confianzaPromedio =
        paginasOCR.length > 0
            ? paginasOCR.reduce((sum, p) => sum + p.confianza, 0) / paginasOCR.length
            : 0;

    const palabrasTotales = paginasOCR.reduce(
        (sum, p) => sum + (p.textoExtraido.split(/\s+/).length || 0),
        0
    );

    const libroOCR: LibroOCR = {
        libro: { ...libro, totalPaginas },
        paginas: paginasOCR,
        estadisticas: {
            totalPaginas,
            paginasProcesadas: paginasOCR.length,
            confianzaPromedio,
            palabrasTotales,
        },
    };

    // Guardar resultado completo
    await fs.writeFile(
        path.join(outputDir, 'libro_completo.json'),
        JSON.stringify(libroOCR, null, 2)
    );

    console.log(`\n   ✅ Completado: ${libro.codigo}`);
    console.log(`      Páginas procesadas: ${paginasOCR.length}`);
    console.log(`      Confianza promedio: ${(confianzaPromedio * 100).toFixed(1)}%`);
    console.log(`      Palabras extraídas: ${palabrasTotales.toLocaleString()}`);

    stats.librosCompletados++;
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Iniciando procesamiento OCR de libros CONALITEG\n');

    if (!GOOGLE_VISION_API_KEY) {
        console.error('❌ Error: GOOGLE_CLOUD_VISION_API_KEY no está configurada');
        console.error('   Por favor configura la variable de entorno con tu API key de Google Cloud\n');
        process.exit(1);
    }

    // Parsear argumentos
    const args = process.argv.slice(2);
    const testMode = args.includes('--test');
    const libroArgument = args.find(arg => arg.startsWith('--libro='));
    const codigoLibro = libroArgument?.split('=')[1];

    // Determinar qué libros procesar
    let librosAProcesar: LibroSEP[];
    if (codigoLibro) {
        const libro = catalogoLibrosSEP.find(l => l.codigo === codigoLibro);
        if (!libro) {
            console.error(`❌ Libro no encontrado: ${codigoLibro}`);
            process.exit(1);
        }
        librosAProcesar = [libro];
    } else {
        librosAProcesar = catalogoLibrosSEP;
    }

    stats.totalLibros = librosAProcesar.length;

    if (testMode) {
        console.log('⚠️  MODO TEST ACTIVADO - Solo se procesarán las primeras 5 páginas de cada libro\n');
    }

    console.log(`📖 Total de libros a procesar: ${stats.totalLibros}\n`);

    // Crear directorio de salida
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Procesar cada libro
    for (const libro of librosAProcesar) {
        await procesarLibro(libro, testMode);
    }

    // Mostrar estadísticas finales
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 ESTADÍSTICAS FINALES');
    console.log('═'.repeat(60));
    console.log(`Libros procesados: ${stats.librosCompletados}/${stats.totalLibros}`);
    console.log(`Páginas procesadas: ${stats.paginasProcesadas}/${stats.totalPaginas}`);
    console.log(`Errores: ${stats.errores.length}`);
    console.log(`\n💰 Costos estimados:`);
    console.log(`   Imágenes procesadas: ${stats.costosEstimados.totalImagenes.toLocaleString()}`);
    console.log(`   Costo estimado: $${stats.costosEstimados.costoUSD.toFixed(2)} USD`);

    if (stats.errores.length > 0) {
        console.log('\n⚠️  Errores encontrados:');
        stats.errores.slice(0, 10).forEach(error => {
            console.log(`   - ${error.libro} (pág. ${error.pagina}): ${error.error}`);
        });
        if (stats.errores.length > 10) {
            console.log(`   ... y ${stats.errores.length - 10} errores más`);
        }
    }

    console.log('\n✅ Proceso completado!');
    console.log(`📁 Los archivos se guardaron en: ${OUTPUT_DIR}\n`);
}

// Ejecutar
main().catch(console.error);
