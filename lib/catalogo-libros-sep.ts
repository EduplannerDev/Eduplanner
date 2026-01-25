/**
 * Catálogo de libros de texto gratuitos de la SEP
 * Ciclo escolar 2025-2026
 * 
 * Este archivo contiene la metadata de todos los libros disponibles en CONALITEG
 * para facilitar el scraping y procesamiento.
 */

export interface LibroSEP {
    codigo: string;         // Código del libro en CONALITEG (ej: "P1PCA", "K3MLA")
    nombre: string;         // Nombre completo del libro
    grado: string;          // Grado escolar (ej: "1°", "2°", etc.)
    nivel: 'Preescolar' | 'Primaria' | 'Secundaria';
    materia: string;        // Materia principal
    cicloEscolar: string;   // Año del ciclo escolar
    totalPaginas?: number;  // Se detectará automáticamente
    url: string;            // URL del libro en CONALITEG
}

/**
 * Libros de Preescolar - Ciclo 2025-2026
 * Fase 2 de la Nueva Escuela Mexicana
 */
export const librosPreescolar: LibroSEP[] = [
    // 1° Preescolar
    {
        codigo: 'K1MLA',
        nombre: 'Múltiples lenguajes',
        grado: '1°',
        nivel: 'Preescolar',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K1MLA.htm'
    },
    {
        codigo: 'K1LPA',
        nombre: 'Explorar e imaginar con mi libro de Preescolar',
        grado: '1°',
        nivel: 'Preescolar',
        materia: 'Exploración',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K1LPA.htm'
    },
    {
        codigo: 'K1LMA',
        nombre: 'Jugar e imaginar con mi material manipulable de Preescolar',
        grado: '1°',
        nivel: 'Preescolar',
        materia: 'Matemáticas',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K1LMA.htm'
    },
    {
        codigo: 'K1LDG',
        nombre: 'Láminas de diálogo con manifestaciones culturales y artísticas. Fase 2',
        grado: '1°',
        nivel: 'Preescolar',
        materia: 'Arte y Cultura',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K1LDG.htm'
    },

    // 2° Preescolar
    {
        codigo: 'K2MLA',
        nombre: 'Múltiples lenguajes',
        grado: '2°',
        nivel: 'Preescolar',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K2MLA.htm'
    },
    {
        codigo: 'K2LPA',
        nombre: 'Explorar e imaginar con mi libro de Preescolar',
        grado: '2°',
        nivel: 'Preescolar',
        materia: 'Exploración',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K2LPA.htm'
    },
    {
        codigo: 'K2LMA',
        nombre: 'Jugar e imaginar con mi material manipulable de Preescolar',
        grado: '2°',
        nivel: 'Preescolar',
        materia: 'Matemáticas',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K2LMA.htm'
    },
    {
        codigo: 'K2LDG',
        nombre: 'Láminas de diálogo con manifestaciones culturales y artísticas. Fase 2',
        grado: '2°',
        nivel: 'Preescolar',
        materia: 'Arte y Cultura',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K2LDG.htm'
    },

    // 3° Preescolar
    {
        codigo: 'K3MLA',
        nombre: 'Múltiples lenguajes',
        grado: '3°',
        nivel: 'Preescolar',
        materia: 'Lenguajes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K3MLA.htm'
    },
    {
        codigo: 'K3LPA',
        nombre: 'Explorar e imaginar con mi libro de Preescolar',
        grado: '3°',
        nivel: 'Preescolar',
        materia: 'Exploración',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K3LPA.htm'
    },
    {
        codigo: 'K3LMA',
        nombre: 'Jugar e imaginar con mi material manipulable de Preescolar',
        grado: '3°',
        nivel: 'Preescolar',
        materia: 'Matemáticas',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K3LMA.htm'
    },
    {
        codigo: 'K3LDG',
        nombre: 'Láminas de diálogo con manifestaciones culturales y artísticas. Fase 2',
        grado: '3°',
        nivel: 'Preescolar',
        materia: 'Arte y Cultura',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K3LDG.htm'
    },

    // Libros transversales para docentes y familias (todos los grados)
    {
        codigo: 'K0MTM',
        nombre: 'Modalidades de trabajo para la acción transformadora y el codiseño',
        grado: '1°, 2°, 3°',
        nivel: 'Preescolar',
        materia: 'Guía para Docentes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K0MTM.htm'
    },
    {
        codigo: 'K0TAM',
        nombre: 'Posibilidades de trabajo para la acción transformadora y el codiseño. Ficheros. Fase 2',
        grado: '1°, 2°, 3°',
        nivel: 'Preescolar',
        materia: 'Guía para Docentes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K0TAM.htm'
    },
    {
        codigo: 'K0LPM',
        nombre: 'Un libro sin recetas para la maestra y el maestro. Fase 2',
        grado: '1°, 2°, 3°',
        nivel: 'Preescolar',
        materia: 'Guía para Docentes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K0LPM.htm'
    },
    {
        codigo: 'K0CFA',
        nombre: 'Crianza para la libertad. Libro para las familias. Fase 2',
        grado: '1°, 2°, 3°',
        nivel: 'Preescolar',
        materia: 'Guía para Familias',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/K0CFA.htm'
    },
];

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
 * Nueva Escuela Mexicana - Fase 6
 */
export const librosSecundaria: LibroSEP[] = [
    // Libro transversal para docentes (todos los grados)
    {
        codigo: 'S0LPM',
        nombre: 'Un libro sin recetas para la maestra y el maestro. Fase 6',
        grado: '1°, 2°, 3°',
        nivel: 'Secundaria',
        materia: 'Guía para Docentes',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S0LPM.htm'
    },

    // 1° Secundaria - Colección Ximhai
    {
        codigo: 'S1ETA',
        nombre: 'Colección Ximhai. Ética, naturaleza y sociedades',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Ética y Ciencias Sociales',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1ETA.htm'
    },
    {
        codigo: 'S1HPA',
        nombre: 'Historia del pueblo mexicano',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Historia',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1HPA.htm'
    },
    {
        codigo: 'S1HUA',
        nombre: 'Colección Ximhai. De lo humano y lo comunitario',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Humanidades',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1HUA.htm'
    },
    {
        codigo: 'S1INA',
        nombre: 'Uérakua anapu uantakua. Projects and Readings',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Inglés',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1INA.htm'
    },
    {
        codigo: 'S1LEA',
        nombre: 'Colección Ximhai. Lenguajes',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Lengua Materna',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1LEA.htm'
    },
    {
        codigo: 'S1MLA',
        nombre: 'Colección Ximhai. Múltiples lenguajes',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Lenguajes Artísticos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1MLA.htm'
    },
    {
        codigo: 'S1NLA',
        nombre: 'Colección Ximhai. Nuestro libro de proyectos',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1NLA.htm'
    },
    {
        codigo: 'S1SAA',
        nombre: 'Colección Ximhai. Saberes y pensamiento científico',
        grado: '1°',
        nivel: 'Secundaria',
        materia: 'Ciencias',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S1SAA.htm'
    },

    // 2° Secundaria - Colección Sk'asolil
    {
        codigo: 'S2ETA',
        nombre: 'Colección Sk´asolil. Ética, naturaleza y sociedades',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Ética y Ciencias Sociales',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2ETA.htm'
    },
    {
        codigo: 'S2HUA',
        nombre: 'Colección Sk´asolil. De lo humano y lo comunitario',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Humanidades',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2HUA.htm'
    },
    {
        codigo: 'S2INA',
        nombre: 'Uérakua anapu uantakua. Projects and Readings',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Inglés',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2INA.htm'
    },
    {
        codigo: 'S2LEA',
        nombre: 'Colección Sk´asolil. Lenguajes',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Lengua Materna',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2LEA.htm'
    },
    {
        codigo: 'S2MLA',
        nombre: 'Colección Sk´asolil. Múltiples lenguajes',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Lenguajes Artísticos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2MLA.htm'
    },
    {
        codigo: 'S2NLA',
        nombre: 'Colección Sk´asolil. Nuestro libro de proyectos',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2NLA.htm'
    },
    {
        codigo: 'S2SAA',
        nombre: 'Colección Sk´asolil. Saberes y pensamiento científico',
        grado: '2°',
        nivel: 'Secundaria',
        materia: 'Ciencias',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S2SAA.htm'
    },

    // 3° Secundaria - Colección Nanahuatzin
    {
        codigo: 'S3ETA',
        nombre: 'Colección Nanahuatzin. Ética, naturaleza y sociedades',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Ética y Ciencias Sociales',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3ETA.htm'
    },
    {
        codigo: 'S3HUA',
        nombre: 'Colección Nanahuatzin. De lo humano y lo comunitario',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Humanidades',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3HUA.htm'
    },
    {
        codigo: 'S3INA',
        nombre: 'Uérakua anapu uantakua. Projects and Readings',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Inglés',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3INA.htm'
    },
    {
        codigo: 'S3LEA',
        nombre: 'Colección Nanahuatzin. Lenguajes',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Lengua Materna',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3LEA.htm'
    },
    {
        codigo: 'S3MLA',
        nombre: 'Colección Nanahuatzin. Múltiples lenguajes',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Lenguajes Artísticos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3MLA.htm'
    },
    {
        codigo: 'S3NLA',
        nombre: 'Colección Nanahuatzin. Nuestro libro de proyectos',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Proyectos',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3NLA.htm'
    },
    {
        codigo: 'S3SAA',
        nombre: 'Colección Nanahuatzin. Saberes y pensamiento científico',
        grado: '3°',
        nivel: 'Secundaria',
        materia: 'Ciencias',
        cicloEscolar: '2025',
        url: 'https://libros.conaliteg.gob.mx/2025/S3SAA.htm'
    },
];

/**
 * Catálogo completo de libros
 */
export const catalogoLibrosSEP: LibroSEP[] = [
    ...librosPreescolar,
    ...librosPrimaria,
    ...librosSecundaria,
];

/**
 * Obtener libros por nivel
 */
export function getLibrosPorNivel(nivel: 'Preescolar' | 'Primaria' | 'Secundaria'): LibroSEP[] {
    return catalogoLibrosSEP.filter(libro => libro.nivel === nivel);
}

/**
 * Obtener libros por grado
 */
export function getLibrosPorGrado(grado: string, nivel?: 'Preescolar' | 'Primaria' | 'Secundaria'): LibroSEP[] {
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
