/**
 * Script para generar embeddings vectoriales para el currículo SEP
 * 
 * Este script:
 * 1. Obtiene todos los registros de curriculo_sep que no tienen embedding
 * 2. Genera embeddings usando OpenAI API
 * 3. Actualiza la base de datos con los embeddings generados
 * 
 * Uso:
 * 1. Configura tu OPENAI_API_KEY en las variables de entorno
 * 2. Ejecuta: npx tsx scripts/generate-curriculo-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Faltan variables de entorno requeridas:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  console.error('- OPENAI_API_KEY')
  process.exit(1)
}

// Inicializar clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// Configuración del modelo
const EMBEDDING_MODEL = 'text-embedding-3-small' // Más económico que ada-002
const BATCH_SIZE = 10 // Procesar en lotes para evitar rate limits
const DELAY_BETWEEN_BATCHES = 1000 // 1 segundo entre lotes

interface CurriculoItem {
  id: string
  contenido: string
  materia: string
  grado: number
  bloque?: string
  campo_formativo?: string
}

async function getCurriculoWithoutEmbeddings(): Promise<CurriculoItem[]> {
  console.log('📋 Obteniendo registros sin embedding...')
  
  const { data, error } = await supabase
    .from('curriculo_sep')
    .select('id, contenido, materia, grado, bloque, campo_formativo')
    .is('embedding', null)
    .order('grado', { ascending: true })
    .order('materia', { ascending: true })

  if (error) {
    throw new Error(`Error obteniendo registros: ${error.message}`)
  }

  console.log(`✅ Encontrados ${data?.length || 0} registros sin embedding`)
  return data || []
}

function createEmbeddingText(item: CurriculoItem): string {
  // Crear un texto enriquecido para el embedding
  const parts = [
    `Materia: ${item.materia}`,
    `Grado: ${item.grado}`,
    item.contenido
  ]

  if (item.bloque) {
    parts.splice(2, 0, `Bloque: ${item.bloque}`)
  }

  if (item.campo_formativo) {
    parts.splice(2, 0, `Campo formativo: ${item.campo_formativo}`)
  }

  return parts.join('. ')
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float'
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('❌ Error generando embedding:', error)
    throw error
  }
}

async function updateCurriculoEmbedding(
  id: string, 
  embedding: number[], 
  model: string
): Promise<void> {
  const { error } = await supabase
    .from('curriculo_sep')
    .update({
      embedding: `[${embedding.join(',')}]`, // Convertir a formato vector
      embedding_model: model,
      embedding_created_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Error actualizando embedding: ${error.message}`)
  }
}

async function processBatch(items: CurriculoItem[]): Promise<void> {
  console.log(`🔄 Procesando lote de ${items.length} elementos...`)

  for (const item of items) {
    try {
      // Crear texto para embedding
      const embeddingText = createEmbeddingText(item)
      
      // Generar embedding
      const embedding = await generateEmbedding(embeddingText)
      
      // Actualizar en base de datos
      await updateCurriculoEmbedding(item.id, embedding, EMBEDDING_MODEL)
      
      console.log(`✅ Procesado: ${item.materia} - ${item.contenido.substring(0, 50)}...`)
      
      // Pequeña pausa para evitar rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`❌ Error procesando ${item.id}:`, error)
      // Continuar con el siguiente elemento
    }
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando generación de embeddings para currículo SEP')
    console.log(`📊 Modelo: ${EMBEDDING_MODEL}`)
    console.log(`📦 Tamaño de lote: ${BATCH_SIZE}`)
    console.log('')

    // Obtener registros sin embedding
    const items = await getCurriculoWithoutEmbeddings()
    
    if (items.length === 0) {
      console.log('✅ Todos los registros ya tienen embeddings')
      return
    }

    // Procesar en lotes
    const totalBatches = Math.ceil(items.length / BATCH_SIZE)
    console.log(`📦 Procesando ${items.length} elementos en ${totalBatches} lotes`)
    console.log('')

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      
      console.log(`📦 Lote ${batchNumber}/${totalBatches}`)
      await processBatch(batch)
      
      // Pausa entre lotes
      if (i + BATCH_SIZE < items.length) {
        console.log(`⏳ Esperando ${DELAY_BETWEEN_BATCHES}ms antes del siguiente lote...`)
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
      
      console.log('')
    }

    console.log('🎉 ¡Generación de embeddings completada!')
    
    // Verificar resultados
    const remaining = await getCurriculoWithoutEmbeddings()
    console.log(`📊 Registros procesados: ${items.length - remaining.length}`)
    console.log(`📊 Registros restantes: ${remaining.length}`)

  } catch (error) {
    console.error('❌ Error en el proceso:', error)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

export { main as generateCurriculoEmbeddings }
