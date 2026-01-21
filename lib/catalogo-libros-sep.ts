/**
 * Catálogo de libros de texto gratuitos de la SEP
 * Ciclo escolar 2025-2026
 * 
 * Este archivo contiene la metadata de todos los libros disponibles en CONALITEG
 * para facilitar el scraping y procesamiento.
 */

export interface LibroSEP {
    codigo: string;         // Código del libro en CONALITEG (ej: "P1PCA")
    nombre: string;         // Nombre completo del libro
    grado: string;          // Grado escolar (ej: "1°", "2°", etc.)
    nivel: 'Primaria' | 'Secundaria';
    materia: string;        // Materia principal
    cicloEscolar: string;   // Año del ciclo escolar
    totalPaginas?: number;  // Se detectará automáticamente
    url: string;            // URL del libro en CONALITEG
}

/**
 * Libros de Primaria - Ciclo 2025-2026
 */
export const librosPrimaria: LibroSEP[] = [
    // 1° Primaria - Ciclo 2025-2026
    {
        codigo: 'P1LPM',
        nombre: 'Un libro sin recetas, para la maestra y el maestro. Fase 3',
        grado: '1°',
        nivel: 'Primaria',
        materia: 'Guía para Docentes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P1LPM.htm'
    },
    {
        codigo: 'P1MLA',
        nombre: 'Múltiples lenguajes',
        grado: '1°',
        nivel: 'Primaria',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P1MLA.htm'
    },
    {
        codigo: 'P1PAA',
        nombre: 'Proyectos de Aula',
        grado: '1°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P1PAA.htm'
    },
    {
        codigo: 'P1PCA',
        nombre: 'Proyectos Comunitarios',
        grado: '1°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P1PCA.htm'
    },
    {
        codigo: 'P1PEA',
        nombre: 'Proyectos Escolares',
        grado: '1°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P1PEA.htm'
    },
    {
        codigo: 'P1SDA',
        nombre: 'Nuestros saberes: Libro para alumnos, maestros y familia',
        grado: '1°',
        nivel: 'Primaria',
        materia: 'Saberes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P1SDA.htm'
    },
    {
        codigo: 'P1TNA',
        nombre: 'Múltiples lenguajes. Trazos y números',
        grado: '1°',
        nivel: 'Primaria',
        materia: 'Matemáticas',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P1TNA.htm'
    },
    {
        codigo: 'P1TPA',
        nombre: 'Múltiples lenguajes. Trazos y palabras',
        grado: '1°',
        nivel: 'Primaria',
        materia: 'Lengua Materna',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P1TPA.htm'
    },


    // 2° Primaria - Ciclo 2025-2026
    {
        codigo: 'P2MLA',
        nombre: 'Múltiples lenguajes',
        grado: '2°',
        nivel: 'Primaria',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P2MLA.htm'
    },
    {
        codigo: 'P2PAA',
        nombre: 'Proyectos de Aula',
        grado: '2°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P2PAA.htm'
    },
    {
        codigo: 'P2PCA',
        nombre: 'Proyectos Comunitarios',
        grado: '2°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P2PCA.htm'
    },
    {
        codigo: 'P2PEA',
        nombre: 'Proyectos Escolares',
        grado: '2°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P2PEA.htm'
    },
    {
        codigo: 'P2SDA',
        nombre: 'Nuestros saberes: Libro para alumnos, maestros y familia',
        grado: '2°',
        nivel: 'Primaria',
        materia: 'Saberes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P2SDA.htm'
    },
    {
        codigo: 'P2TNA',
        nombre: 'Múltiples lenguajes. Trazos y números',
        grado: '2°',
        nivel: 'Primaria',
        materia: 'Matemáticas',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P2TNA.htm'
    },
    {
        codigo: 'P2TPA',
        nombre: 'Múltiples lenguajes. Trazos y palabras',
        grado: '2°',
        nivel: 'Primaria',
        materia: 'Lengua Materna',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P2TPA.htm'
    },

    // 3° Primaria - Ciclo 2025-2026
    {
        codigo: 'P3MLA',
        nombre: 'Múltiples lenguajes',
        grado: '3°',
        nivel: 'Primaria',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P3MLA.htm'
    },
    {
        codigo: 'P3PAA',
        nombre: 'Proyectos de Aula',
        grado: '3°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P3PAA.htm'
    },
    {
        codigo: 'P3PCA',
        nombre: 'Proyectos Comunitarios',
        grado: '3°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P3PCA.htm'
    },
    {
        codigo: 'P3PEA',
        nombre: 'Proyectos Escolares',
        grado: '3°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P3PEA.htm'
    },
    {
        codigo: 'P3SDA',
        nombre: 'Nuestros saberes: Libro para alumnos, maestros y familia',
        grado: '3°',
        nivel: 'Primaria',
        materia: 'Saberes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P3SDA.htm'
    },

    // 4° Primaria - Ciclo 2025-2026
    {
        codigo: 'P4MLA',
        nombre: 'Múltiples lenguajes',
        grado: '4°',
        nivel: 'Primaria',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P4MLA.htm'
    },
    {
        codigo: 'P4PAA',
        nombre: 'Proyectos de Aula',
        grado: '4°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P4PAA.htm'
    },
    {
        codigo: 'P4PCA',
        nombre: 'Proyectos Comunitarios',
        grado: '4°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P4PCA.htm'
    },
    {
        codigo: 'P4PEA',
        nombre: 'Proyectos Escolares',
        grado: '4°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P4PEA.htm'
    },
    {
        codigo: 'P4SDA',
        nombre: 'Nuestros saberes: Libro para alumnos, maestros y familia',
        grado: '4°',
        nivel: 'Primaria',
        materia: 'Saberes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P4SDA.htm'
    },

    // 5° Primaria - Ciclo 2025-2026
    {
        codigo: 'P5MLA',
        nombre: 'Múltiples lenguajes',
        grado: '5°',
        nivel: 'Primaria',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P5MLA.htm'
    },
    {
        codigo: 'P5PAA',
        nombre: 'Proyectos de Aula',
        grado: '5°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P5PAA.htm'
    },
    {
        codigo: 'P5PCA',
        nombre: 'Proyectos Comunitarios',
        grado: '5°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P5PCA.htm'
    },
    {
        codigo: 'P5PEA',
        nombre: 'Proyectos Escolares',
        grado: '5°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P5PEA.htm'
    },
    {
        codigo: 'P5SDA',
        nombre: 'Nuestros saberes: Libro para alumnos, maestros y familia',
        grado: '5°',
        nivel: 'Primaria',
        materia: 'Saberes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P5SDA.htm'
    },

    // 6° Primaria - Ciclo 2025-2026
    {
        codigo: 'P6MLA',
        nombre: 'Múltiples lenguajes',
        grado: '6°',
        nivel: 'Primaria',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P6MLA.htm'
    },
    {
        codigo: 'P6PAA',
        nombre: 'Proyectos de Aula',
        grado: '6°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P6PAA.htm'
    },
    {
        codigo: 'P6PCA',
        nombre: 'Proyectos Comunitarios',
        grado: '6°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P6PCA.htm'
    },
    {
        codigo: 'P6PEA',
        nombre: 'Proyectos Escolares',
        grado: '6°',
        nivel: 'Primaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P6PEA.htm'
    },
    {
        codigo: 'P6SDA',
        nombre: 'Nuestros saberes: Libro para alumnos, maestros y familia',
        grado: '6°',
        nivel: 'Primaria',
        materia: 'Saberes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/P6SDA.htm'
    },
];

/**
 * Libros de Secundaria - Ciclo 2025-2026
 */
export const librosSecundaria: LibroSEP[] = [
    // 1° Secundaria
    {
        codigo: 'S1ESP',
        nombre: 'Lengua Materna Español',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Lengua Materna',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1ESP.htm'
    },
    {
        codigo: 'S1MAT',
        nombre: 'Matemáticas',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Matemáticas',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1MAT.htm'
    },
    {
        codigo: 'S1CYT',
        nombre: 'Ciencia y Tecnología',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Ciencias',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1CYT.htm'
    },
    {
        codigo: 'S1HIS',
        nombre: 'Historia',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Historia',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1HIS.htm'
    },
    {
        codigo: 'S1GEO',
        nombre: 'Geografía',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Geografía',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1GEO.htm'
    },

    // 2° Secundaria
    {
        codigo: 'S2ESP',
        nombre: 'Lengua Materna Español',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Lengua Materna',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2ESP.htm'
    },
    {
        codigo: 'S2MAT',
        nombre: 'Matemáticas',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Matemáticas',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2MAT.htm'
    },
    {
        codigo: 'S2CYT',
        nombre: 'Ciencia y Tecnología',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Ciencias',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2CYT.htm'
    },
    {
        codigo: 'S2HIS',
        nombre: 'Historia',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Historia',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2HIS.htm'
    },

    // 3° Secundaria
    {
        codigo: 'S3ESP',
        nombre: 'Lengua Materna Español',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Lengua Materna',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3ESP.htm'
    },
    {
        codigo: 'S3MAT',
        nombre: 'Matemáticas',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Matemáticas',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3MAT.htm'
    },
    {
        codigo: 'S3CYT',
        nombre: 'Ciencia y Tecnología',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Ciencias',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3CYT.htm'
    },
    {
        codigo: 'S3HIS',
        nombre: 'Historia',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Historia',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3HIS.htm'
    },
];

/**
 * Catálogo completo de libros
 */
export const catalogoLibrosSEP: LibroSEP[] = [
    ...librosPrimaria,
    ...librosSecundaria,
];

/**
 * Obtener libros por nivel
 */
export function getLibrosPorNivel(nivel: 'Primaria' | 'Secundaria'): LibroSEP[] {
    return catalogoLibrosSEP.filter(libro => libro.nivel === nivel);
}

/**
 * Obtener libros por grado
 */
export function getLibrosPorGrado(grado: string, nivel?: 'Primaria' | 'Secundaria'): LibroSEP[] {
    return catalogoLibrosSEP.filter(libro =>
        libro.grado === grado && (nivel ? libro.nivel === nivel : true)
    );
}

/**
 * Obtener libro por código
 */
export function getLibroPorCodigo(codigo: string): LibroSEP | undefined {
    return catalogoLibrosSEP.find(libro => libro.codigo === codigo);
}
