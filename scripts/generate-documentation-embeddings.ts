/**
 * Script para generar embeddings vectoriales para la documentación de flujos
 * 
 * Este script:
 * 1. Lee todos los archivos .txt de la carpeta docs/flujos
 * 2. Procesa el contenido y extrae secciones
 * 3. Genera embeddings usando Google Gemini API
 * 4. Almacena en la tabla documentation_embeddings
 * 
 * Uso:
 * 1. Configura tu GOOGLE_GENERATIVE_AI_API_KEY en las variables de entorno
 * 2. Ejecuta: npx tsx scripts/generate-documentation-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import { google } from '@ai-sdk/google'
import { embed } from 'ai'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno desde .env.local si existe, o .env
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Inicializar clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface DocumentationEntry {
  module_name: string
  flow_type: string
  title: string
  content: string
  file_path: string
  section_title?: string
  section_content?: string
  keywords: string[]
}

// Función para extraer palabras clave del contenido
function extractKeywords(content: string): string[] {
  const keywords = new Set<string>()

  // Palabras clave comunes en documentación educativa
  const educationalKeywords = [
    'planeacion', 'planeación', 'examen', 'proyecto', 'dosificacion', 'dosificación',
    'estudiante', 'alumno', 'profesor', 'maestro', 'clase', 'materia', 'grado',
    'evaluacion', 'evaluación', 'rubrica', 'rúbrica', 'actividad', 'objetivo',
    'contenido', 'curriculo', 'currículo', 'pda', 'campo formativo', 'metodologia',
    'metodología', 'IA', 'inteligencia artificial', 'chat', 'generar', 'crear',
    'guardar', 'editar', 'eliminar', 'descargar', 'pdf', 'documento', 'asistencia',
    'incidencia', 'reporte', 'seguridad', 'acta', 'firma'
  ]

  const lowerContent = content.toLowerCase()

  // Buscar palabras clave educativas
  educationalKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      keywords.add(keyword.toLowerCase())
    }
  })

  // Extraer palabras de títulos y secciones importantes
  const lines = content.split('\n')
  lines.forEach(line => {
    if (line.includes('PASO') || line.includes('CÓMO') || line.includes('GUÍA')) {
      const words = line.toLowerCase()
        .replace(/[^\w\sáéíóúñ]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)

      words.forEach(word => keywords.add(word))
    }
  })

  return Array.from(keywords)
}

// Función para procesar un archivo de documentación
function processDocumentationFile(filePath: string): DocumentationEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const fileName = path.basename(filePath, '.txt')

  // Extraer información del nombre del archivo
  let module_name = ''
  let flow_type = ''
  let title = ''

  if (fileName.includes('CREAR_PLANEACION')) {
    module_name = 'planeaciones'
    flow_type = 'crear'
    title = 'Cómo Crear una Planeación'
  } else if (fileName.includes('GENERAR_EXAMEN')) {
    module_name = 'examenes'
    flow_type = 'generar'
    title = 'Cómo Generar un Examen'
  } else if (fileName.includes('CREAR_PROYECTO')) {
    module_name = 'proyectos'
    flow_type = 'crear'
    title = 'Cómo Crear un Proyecto'
  } else if (fileName.includes('GESTIONAR_MIS_PROYECTOS')) {
    module_name = 'proyectos'
    flow_type = 'gestionar'
    title = 'Cómo Gestionar Mis Proyectos'
  } else if (fileName.includes('USAR_DOSIFICACION')) {
    module_name = 'dosificacion'
    flow_type = 'usar'
    title = 'Cómo Usar el Módulo de Dosificación'
  } else if (fileName.includes('USAR_INCIDENCIAS')) {
    module_name = 'incidencias'
    flow_type = 'usar'
    title = 'Cómo Usar Módulo de Incidencias'
  } else if (fileName.includes('TOMAR_ASISTENCIA')) {
    module_name = 'asistencia'
    flow_type = 'tomar'
    title = 'Cómo Tomar Asistencia'
  } else if (fileName.includes('CREAR_PRESENTACION')) {
    module_name = 'presentaciones'
    flow_type = 'crear'
    title = 'Cómo Crear Presentaciones IA'
  } else if (fileName.includes('CREAR_PLAN_ANALITICO')) {
    module_name = 'plan_analitico'
    flow_type = 'crear'
    title = 'Cómo Crear Plan Analítico'
  } else if (fileName.includes('GESTIONAR_PLANEACIONES')) {
    module_name = 'planeaciones'
    flow_type = 'gestionar'
    title = 'Cómo Gestionar Planeaciones'
  } else if (fileName.includes('GESTIONAR_GRUPOS_Y_ALUMNOS')) {
    module_name = 'grupos_alumnos'
    flow_type = 'gestionar'
    title = 'Cómo Gestionar Grupos y Alumnos'
  }

  const keywords = extractKeywords(content)

  const entries: DocumentationEntry[] = []

  // Entrada principal (documento completo)
  entries.push({
    module_name,
    flow_type,
    title,
    content,
    file_path: filePath,
    keywords
  })

  // Procesar secciones individuales
  const sections = content.split('===============================================================================')
  sections.forEach((section, index) => {
    if (section.trim() && index > 0) {
      const lines = section.trim().split('\n')
      const sectionTitle = lines[0]?.trim()

      if (sectionTitle && sectionTitle.length > 0) {
        entries.push({
          module_name,
          flow_type,
          title: `${title} - ${sectionTitle}`,
          content,
          file_path: filePath,
          section_title: sectionTitle,
          section_content: section.trim(),
          keywords: [...keywords, ...extractKeywords(section)]
        })
      }
    }
  })

  return entries
}

// Función para generar embedding
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: text,
    })

    return embedding
  } catch (error) {
    console.error('Error generando embedding:', error)
    throw error
  }
}

// Función para insertar documentación en la base de datos
async function insertDocumentation(entry: DocumentationEntry, embedding: number[]): Promise<void> {
  const payload = {
    module_name: entry.module_name,
    flow_type: entry.flow_type,
    title: entry.title,
    content: entry.content,
    // file_path: entry.file_path, // Columna faltante en DB
    section_title: entry.section_title,
    section_content: entry.section_content,
    keywords: entry.keywords,
    embedding: embedding, // Pass raw array, don't stringify
    embedding_model: 'text-embedding-004',
    embedding_created_at: new Date().toISOString()
  }

  console.log('Payload keys:', Object.keys(payload))

  const { error } = await supabase
    .from('documentation_embeddings')
    .insert(payload)

  if (error) {
    throw new Error(`Error insertando documentación: ${error.message}`)
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando generación de embeddings para documentación...')

  const docsPath = path.join(process.cwd(), 'docs', 'flujos')

  if (!fs.existsSync(docsPath)) {
    console.error(`❌ No se encontró la carpeta: ${docsPath}`)
    process.exit(1)
  }

  // Limpiar tabla existente
  console.log('🧹 Limpiando tabla documentation_embeddings...')
  const { error: deleteError } = await supabase
    .from('documentation_embeddings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos

  if (deleteError) {
    console.error('❌ Error limpiando tabla:', deleteError)
    process.exit(1)
  }

  // Leer archivos de documentación
  const files = fs.readdirSync(docsPath).filter(file => file.endsWith('.txt'))
  console.log(`📁 Encontrados ${files.length} archivos de documentación`)

  let totalEntries = 0
  let processedEntries = 0

  for (const file of files) {
    const filePath = path.join(docsPath, file)
    console.log(`📄 Procesando: ${file}`)

    try {
      const entries = processDocumentationFile(filePath)
      totalEntries += entries.length

      for (const entry of entries) {
        console.log(`  📝 Generando embedding para: ${entry.section_title || entry.title}`)

        // Usar section_content si existe, sino el content completo
        const textToEmbed = entry.section_content || entry.content
        const embedding = await generateEmbedding(textToEmbed)

        await insertDocumentation(entry, embedding)
        processedEntries++

        // Pequeña pausa para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`  ✅ Completado: ${file}`)
    } catch (error) {
      console.error(`  ❌ Error procesando ${file}:`, error)
    }
  }

  console.log(`\n🎉 Proceso completado!`)
  console.log(`📊 Estadísticas:`)
  console.log(`   - Archivos procesados: ${files.length}`)
  console.log(`   - Entradas totales: ${totalEntries}`)
  console.log(`   - Entradas procesadas: ${processedEntries}`)
  console.log(`   - Embeddings generados: ${processedEntries}`)
}

// Ejecutar script
main().catch(console.error)