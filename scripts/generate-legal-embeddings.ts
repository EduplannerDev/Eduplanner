import { createClient } from '@supabase/supabase-js'
import { google } from '@ai-sdk/google'
import { embed } from 'ai'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Cargar variables de entorno
dotenv.config({ path: '.env' }) // Ajusta si tu archivo se llama solo .env

// Validación rápida de variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Faltan variables de Supabase en el archivo .env')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function generateLegalEmbeddings() {
    console.log('\n⚖️  INICIANDO SISTEMA DE INGESTA LEGAL...')

    const legalDir = path.join(process.cwd(), 'docs/legal')

    // 1. Validar directorio
    if (!fs.existsSync(legalDir)) {
        console.error(`❌ No encuentro el directorio: ${legalDir}`)
        console.log('💡 Crea la carpeta y agrega los archivos .txt de los protocolos.')
        return
    }

    // --- PASO CRÍTICO: LIMPIEZA INICIAL (Idempotencia) ---
    console.log('🧹 Limpiando base de datos de protocolos antiguos...')
    // Borramos todo lo que no sea ID cero (o sea, todo)
    const { error: deleteError } = await supabase
        .from('legal_documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
        console.error('❌ Error fatal limpiando BD:', deleteError.message)
        return
    }
    console.log('✨ Base de datos limpia. Lista para nueva ingesta.\n')
    // -----------------------------------------------------

    // 2. Leer todos los archivos .txt
    const files = fs.readdirSync(legalDir).filter(file => file.endsWith('.txt'))

    if (files.length === 0) {
        console.log('⚠️  No se encontraron archivos .txt en docs/legal/')
        return
    }

    console.log(`📂 Se encontraron ${files.length} protocolos para procesar.`)

    // 3. Procesar archivo por archivo
    for (const file of files) {
        const filePath = path.join(legalDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')

        console.log(`\n📄 Procesando: ${file}`)

        // 4. Extracción Inteligente de Metadatos
        // Busca las líneas "TITULO: ..." y "CATEGORIA: ..." dentro del txt
        const titleMatch = content.match(/TITULO:\s*(.+)/)
        const categoryMatch = content.match(/CATEGORIA:\s*(.+)/)

        // Si no encuentra el tag en el txt, usa el nombre del archivo como fallback
        const docTitle = titleMatch ? titleMatch[1].trim() : `Protocolo ${file.replace('.txt', '').replace(/_/g, ' ')}`
        const docCategory = categoryMatch ? categoryMatch[1].trim() : 'seguridad'

        console.log(`   🏷️  Metadatos detectados:`)
        console.log(`      - Título: "${docTitle}"`)
        console.log(`      - Categoría: "${docCategory}"`)

        // 5. Dividir en secciones lógicas
        // Separa por doble salto de línea (párrafos) para no cortar ideas a la mitad
        const sections = content.split(/\n\s*\n/).filter(s => s.trim().length > 0)

        console.log(`   🧩 Generando embeddings para ${sections.length} secciones...`)

        // Barra de progreso visual simple
        let processedCount = 0;

        for (const section of sections) {
            try {
                // A. Generar Vector con Vercel AI SDK
                const { embedding } = await embed({
                    model: google.textEmbeddingModel('text-embedding-004'),
                    value: section,
                })

                // B. Guardar en Supabase
                const { error } = await supabase.from('legal_documents').insert({
                    title: docTitle,
                    category: docCategory,
                    content: section.trim(),
                    embedding: embedding, // Vercel AI devuelve el array directo
                    active: true,
                    // Opcional: Podrías agregar 'source_file': file si agregaste esa columna
                })

                if (error) throw error

                processedCount++
                process.stdout.write('✅ ') // Feedback visual

            } catch (e) {
                console.error(`\n   ❌ Error en una sección de ${file}:`, e)
            }
        }
    }

    console.log('\n\n🏁 ------------------------------------------------')
    console.log('🎉 PROCESO TERMINADO EXITOSAMENTE')
    console.log('   Tu "Abogado IA" tiene los conocimientos actualizados.')
    console.log('----------------------------------------------------')
}

generateLegalEmbeddings().catch(console.error)