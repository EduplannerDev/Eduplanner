/**
 * Script para descargar imágenes de libros de texto de CONALITEG
 * 
 * Este script:
 * 1. Lee el catálogo de libros SEP
 * 2. Para cada libro, detecta el número total de páginas
 * 3. Descarga todas las imágenes JPG de cada página
 * 4. Organiza las imágenes en carpetas por libro
 * 
 * Uso:
 *   npx tsx scripts/scrape-conaliteg-books.ts [--libro=P1PCA] [--test]
 * 
 * Opciones:
 *   --libro: Procesar solo un libro específico por código
 *   --test: Modo de prueba (solo descarga las primeras 5 páginas)
 */

import fs from 'fs/promises';
import path from 'path';
import { catalogoLibrosSEP, type LibroSEP } from '../lib/catalogo-libros-sep';

const BASE_URL_PATTERN = 'https://libros.conaliteg.gob.mx/2025/c';
const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads', 'sep-books');

interface DownloadStats {
    totalLibros: number;
    librosCompletados: number;
    totalPaginas: number;
    paginasDescargadas: number;
    errores: Array<{ libro: string; error: string }>;
}

const stats: DownloadStats = {
    totalLibros: 0,
    librosCompletados: 0,
    totalPaginas: 0,
    paginasDescargadas: 0,
    errores: [],
};

/**
 * Detecta el número total de páginas de un libro
 * Busca en la página HTML la variable `ag_pages`
 */
async function detectarTotalPaginas(libroUrl: string): Promise<number> {
    try {
        const response = await fetch(libroUrl);
        const html = await response.text();

        // Buscar la variable ag_pages en el script
        const match = html.match(/var\s+ag_pages\s*=\s*(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }

        console.warn(`⚠️  No se pudo detectar ag_pages en ${libroUrl}, intentando método alternativo...`);

        // Método alternativo: probar páginas hasta encontrar 404
        return await detectarPaginasPorPrueba(libroUrl);
    } catch (error) {
        console.error(`Error detectando páginas de ${libroUrl}:`, error);
        return 0;
    }
}

/**
 * Método alternativo: probar páginas incrementalmente hasta encontrar 404
 */
async function detectarPaginasPorPrueba(libroUrl: string): Promise<number> {
    const codigo = libroUrl.match(/\/(\w+)\.htm/)![1];
    let pagina = 1;
    let consecutivos404 = 0;
    const MAX_CONSECUTIVOS = 3;

    while (consecutivos404 < MAX_CONSECUTIVOS && pagina < 500) {
        const pageNumber = String(pagina).padStart(3, '0');
        const imageUrl = `${BASE_URL_PATTERN}/${codigo}/${pageNumber}.jpg`;

        try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            if (response.ok) {
                consecutivos404 = 0;
                pagina++;
            } else {
                consecutivos404++;
                pagina++;
            }
        } catch {
            consecutivos404++;
            pagina++;
        }
    }

    return Math.max(0, pagina - MAX_CONSECUTIVOS - 1);
}

/**
 * Descarga una imagen individual
 */
async function descargarImagen(url: string, destPath: string): Promise<boolean> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return false;
        }

        const buffer = await response.arrayBuffer();
        await fs.writeFile(destPath, Buffer.from(buffer));
        return true;
    } catch (error) {
        console.error(`Error descargando ${url}:`, error);
        return false;
    }
}

/**
 * Descarga todas las páginas de un libro
 */
async function descargarLibro(libro: LibroSEP, testMode: boolean = false): Promise<void> {
    console.log(`\n📚 Procesando: ${libro.nombre} (${libro.grado} ${libro.nivel})`);
    console.log(`   Código: ${libro.codigo}`);

    // Crear directorio para el libro
    const libroDir = path.join(DOWNLOADS_DIR, libro.cicloEscolar, libro.codigo);
    await fs.mkdir(libroDir, { recursive: true });

    // Detectar total de páginas
    console.log('   Detectando número de páginas...');
    const totalPaginas = await detectarTotalPaginas(libro.url);

    if (totalPaginas === 0) {
        console.error(`   ❌ No se pudo detectar el número de páginas`);
        stats.errores.push({ libro: libro.codigo, error: 'No se pudo detectar número de páginas' });
        return;
    }

    const paginasADescargar = testMode ? Math.min(5, totalPaginas) : totalPaginas;
    console.log(`   Total de páginas: ${totalPaginas}${testMode ? ' (modo test: solo 5)' : ''}`);

    stats.totalPaginas += paginasADescargar;

    // Descargar páginas en paralelo (batches de 5)
    const BATCH_SIZE = 5;
    for (let i = 1; i <= paginasADescargar; i += BATCH_SIZE) {
        const batch = [];

        for (let j = i; j < Math.min(i + BATCH_SIZE, paginasADescargar + 1); j++) {
            const pageNumber = String(j).padStart(3, '0');
            const imageUrl = `${BASE_URL_PATTERN}/${libro.codigo}/${pageNumber}.jpg`;
            const destPath = path.join(libroDir, `${pageNumber}.jpg`);

            // Verificar si ya existe
            try {
                await fs.access(destPath);
                stats.paginasDescargadas++;
                continue; // Ya existe, skip
            } catch {
                // No existe, descargar
            }

            batch.push(
                descargarImagen(imageUrl, destPath).then(success => {
                    if (success) {
                        stats.paginasDescargadas++;
                        process.stdout.write(`\r   Descargando: ${stats.paginasDescargadas}/${paginasADescargar} páginas`);
                    } else {
                        stats.errores.push({ libro: libro.codigo, error: `Error en página ${j}` });
                    }
                })
            );
        }

        await Promise.all(batch);
    }

    console.log(`\n   ✅ Completado: ${libro.codigo}`);
    stats.librosCompletados++;

    // Guardar metadata del libro
    const metadata = {
        ...libro,
        totalPaginas,
        fechaDescarga: new Date().toISOString(),
    };
    await fs.writeFile(
        path.join(libroDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
    );
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Iniciando scraping de libros CONALITEG\n');

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
        console.log('⚠️  MODO TEST ACTIVADO - Solo se descargarán las primeras 5 páginas de cada libro\n');
    }

    console.log(`📖 Total de libros a procesar: ${stats.totalLibros}\n`);

    // Crear directorio de descargas
    await fs.mkdir(DOWNLOADS_DIR, { recursive: true });

    // Procesar cada libro secuencialmente (para no sobrecargar el servidor)
    for (const libro of librosAProcesar) {
        await descargarLibro(libro, testMode);

        // Pequeña pausa entre libros
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Mostrar estadísticas finales
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 ESTADÍSTICAS FINALES');
    console.log('═'.repeat(60));
    console.log(`Libros procesados: ${stats.librosCompletados}/${stats.totalLibros}`);
    console.log(`Páginas descargadas: ${stats.paginasDescargadas}/${stats.totalPaginas}`);
    console.log(`Errores: ${stats.errores.length}`);

    if (stats.errores.length > 0) {
        console.log('\n⚠️  Errores encontrados:');
        stats.errores.forEach(error => {
            console.log(`   - ${error.libro}: ${error.error}`);
        });
    }

    console.log('\n✅ Proceso completado!');
    console.log(`📁 Los archivos se guardaron en: ${DOWNLOADS_DIR}\n`);
}

// Ejecutar
main().catch(console.error);
