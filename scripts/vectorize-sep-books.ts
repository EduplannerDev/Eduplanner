/**
 * Script para vectorizar contenido de libros SEP y cargar en Supabase
 * 
 * Este script:
 * 1. Lee los archivos OCR procesados
 * 2. Divide el contenido en chunks apropiados
 * 3. Genera embeddings con Google AI
 * 4. Inserta en la tabla sep_books_content de Supabase
 * 
 * Requiere:
 *   - GOOGLE_GENERATIVE_AI_API_KEY (puede ser la misma del proyecto)
 *   - SUPABASE_SERVICE_ROLE_KEY
 * 
 * Uso:
 *   npx tsx scripts/vectorize-sep-books.ts [--libro=P1PCA]
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { google } from '@ai-sdk/google';
import { embed } from 'ai';
import { createServiceClient } from '../lib/supabase';
import { catalogoLibrosSEP, type LibroSEP } from '../lib/catalogo-libros-sep';


const OUTPUT_DIR = path.join(process.cwd(), 'downloads', 'sep-books-ocr');
const CHUNK_SIZE = 1000; // Caracteres por chunk
const CHUNK_OVERLAP = 200; // Overlap entre chunks

interface LibroOCR {
    libro: LibroSEP & { totalPaginas: number };
    paginas: Array<{
        numeroPagina: number;
        textoExtraido: string;
        confianza: number;
    }>;
}

interface Chunk {
    contenido: string;
    paginaInicio: number;
    paginaFin: number;
    seccion?: string;
}

interface Stats {
    totalLibros: number;
    librosCompletados: number;
    totalChunks: number;
    chunksInsertados: number;
    errores: string[];
}

const stats: Stats = {
    totalLibros: 0,
    librosCompletados: 0,
    totalChunks: 0,
    chunksInsertados: 0,
    errores: [],
};

/**
 * Divide el texto en chunks manejables
 */
function dividirEnChunks(paginas: LibroOCR['paginas']): Chunk[] {
    const chunks: Chunk[] = [];
    let textoBuffer = '';
    let paginaInicio = 1;

    for (const pagina of paginas) {
        textoBuffer += pagina.textoExtraido + '\n\n';

        // Si el buffer supera el tamaño del chunk, crear un nuevo chunk
        while (textoBuffer.length >= CHUNK_SIZE) {
            const contenido = textoBuffer.substring(0, CHUNK_SIZE + CHUNK_OVERLAP);
            chunks.push({
                contenido: contenido.trim(),
                paginaInicio,
                paginaFin: pagina.numeroPagina,
            });

            // Avanzar con overlap
            textoBuffer = textoBuffer.substring(CHUNK_SIZE);
            paginaInicio = pagina.numeroPagina;
        }
    }

    // Agregar el último chunk si queda contenido
    if (textoBuffer.trim().length > 100) {
        chunks.push({
            contenido: textoBuffer.trim(),
            paginaInicio,
            paginaFin: paginas[paginas.length - 1].numeroPagina,
        });
    }

    return chunks;
}

/**
 * Detecta la sección del libro basándose en el contenido
 */
function detectarSeccion(contenido: string): string | null {
    const contenidoLower = contenido.toLowerCase();

    // Patrones comunes de secciones
    const patrones = [
        { regex: /presentaci[oó]n/i, seccion: 'Presentación' },
        { regex: /introducci[oó]n/i, seccion: 'Introducción' },
        { regex: /unidad\s+\d+/i, seccion: 'Unidad' },
        { regex: /cap[ií]tulo\s+\d+/i, seccion: 'Capítulo' },
        { regex: /tema\s+\d+/i, seccion: 'Tema' },
        { regex: /lecci[oó]n\s+\d+/i, seccion: 'Lección' },
        { regex: /actividad(es)?/i, seccion: 'Actividades' },
        { regex: /evaluaci[oó]n/i, seccion: 'Evaluación' },
        { regex: /bibliograf[ií]a/i, seccion: 'Bibliografía' },
        { regex: /glosario/i, seccion: 'Glosario' },
    ];

    for (const patron of patrones) {
        if (patron.regex.test(contenido)) {
            const match = contenido.match(patron.regex);
            return match ? match[0] : patron.seccion;
        }
    }

    return null;
}

/**
 * Vectoriza y carga un libro en Supabase
 */
async function vectorizarLibro(libro: LibroSEP): Promise<void> {
    console.log(`\n📚 Vectorizando: ${libro.nombre} (${libro.grado} ${libro.nivel})`);
    console.log(`   Código: ${libro.codigo}`);

    const supabase = createServiceClient();

    // Leer archivo OCR
    const ocrPath = path.join(OUTPUT_DIR, libro.cicloEscolar, libro.codigo, 'libro_completo.json');

    let libroOCR: LibroOCR;
    try {
        const ocrContent = await fs.readFile(ocrPath, 'utf-8');
        libroOCR = JSON.parse(ocrContent);
    } catch (error) {
        console.error(`   ❌ No se pudo leer archivo OCR`);
        stats.errores.push(`${libro.codigo}: Archivo OCR no encontrado`);
        return;
    }

    // Dividir en chunks
    console.log('   Dividiendo en chunks...');
    const chunks = dividirEnChunks(libroOCR.paginas);
    console.log(`   Total de chunks: ${chunks.length}`);

    stats.totalChunks += chunks.length;

    // Procesar chunks en batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);

        // Generar embeddings en paralelo
        const embeddingsPromises = batch.map(async chunk => {
            try {
                const { embedding } = await embed({
                    model: google.textEmbeddingModel('text-embedding-004'),
                    value: chunk.contenido,
                });

                return {
                    libro_codigo: libro.codigo,
                    libro_nombre: libro.nombre,
                    grado: libro.grado,
                    nivel: libro.nivel,
                    materia: libro.materia,
                    ciclo_escolar: libro.cicloEscolar,
                    seccion: detectarSeccion(chunk.contenido),
                    contenido: chunk.contenido,
                    pagina_inicio: chunk.paginaInicio,
                    pagina_fin: chunk.paginaFin,
                    embedding,
                    metadata: {
                        totalPaginas: libroOCR.libro.totalPaginas,
                        palabras: chunk.contenido.split(/\s+/).length,
                    },
                };
            } catch (error) {
                console.error(`   Error generando embedding para chunk ${i}:`, error);
                stats.errores.push(`${libro.codigo}: Error en chunk ${i}`);
                return null;
            }
        });

        const records = (await Promise.all(embeddingsPromises)).filter(Boolean);

        // Insertar en Supabase
        if (records.length > 0) {
            const { error } = await supabase.from('sep_books_content').insert(records);

            if (error) {
                console.error(`   Error insertando batch ${i / BATCH_SIZE + 1}:`, error);
                stats.errores.push(`${libro.codigo}: Error insertando batch`);
            } else {
                stats.chunksInsertados += records.length;
                process.stdout.write(`\r   Insertados: ${stats.chunksInsertados}/${stats.totalChunks} chunks`);
            }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n   ✅ Completado: ${libro.codigo}`);
    stats.librosCompletados++;
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Iniciando vectorización de libros SEP\n');

    // Verificar variables de entorno
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY no configurada');
        process.exit(1);
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY no configurada');
        process.exit(1);
    }

    // Parsear argumentos
    const args = process.argv.slice(2);
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
    console.log(`📖 Total de libros a vectorizar: ${stats.totalLibros}\n`);

    // Procesar cada libro
    for (const libro of librosAProcesar) {
        await vectorizarLibro(libro);
    }

    // Estadísticas finales
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 ESTADÍSTICAS FINALES');
    console.log('═'.repeat(60));
    console.log(`Libros vectorizados: ${stats.librosCompletados}/${stats.totalLibros}`);
    console.log(`Chunks procesados: ${stats.chunksInsertados}/${stats.totalChunks}`);
    console.log(`Errores: ${stats.errores.length}`);

    if (stats.errores.length > 0) {
        console.log('\n⚠️  Errores:');
        stats.errores.slice(0, 10).forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n✅ Vectorización completada!');
    console.log('💡 Ahora los libros están disponibles para búsqueda semántica en Supabase\n');
}

// Ejecutar
main().catch(console.error);
