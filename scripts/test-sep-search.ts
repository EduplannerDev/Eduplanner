import { buscarContenidoLibrosSEP } from '../lib/sep-books-search';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function testSearch() {
    console.log('🚀 Iniciando prueba de búsqueda de libros SEP...');

    const casosPrueba = [
        {
            grado: 4,
            materia: 'Matemáticas',
            tema: 'fracciones',
            contexto: 'suma y resta de fracciones con denominadores iguales'
        },
        {
            grado: 1,
            materia: 'Español',
            tema: 'lectoescritura',
            contexto: 'aprender a leer palabras con m y p'
        },
        {
            grado: 6,
            materia: 'Ciencias Naturales',
            tema: 'sistema solar',
            contexto: 'planetas y sus caracteristicas'
        }
    ];

    for (const caso of casosPrueba) {
        console.log(`\n-----------------------------------`);
        console.log(`🧪 Probando: Grado ${caso.grado} - ${caso.materia}: "${caso.tema}"`);
        console.log(`📝 Contexto: ${caso.contexto}`);

        try {
            const resultados = await buscarContenidoLibrosSEP(
                caso.grado,
                caso.materia,
                caso.tema,
                caso.contexto
            );

            if (resultados.length > 0) {
                console.log(`✅ Encontrados ${resultados.length} libros:`);
                resultados.forEach((lib, i) => {
                    console.log(`   ${i + 1}. [${lib.codigo}] ${lib.libro}`);
                    console.log(`      Páginas: ${lib.paginas}`);
                    console.log(`      Relevancia: ${(lib.relevancia * 100).toFixed(2)}%`);
                    console.log(`      Snippet: ${lib.contenido.substring(0, 100)}...`);
                });
            } else {
                console.log('⚠️ No se encontraron resultados.');
            }
        } catch (error) {
            console.error('❌ Error en la prueba:', error);
        }
    }
}

testSearch().catch(console.error);
