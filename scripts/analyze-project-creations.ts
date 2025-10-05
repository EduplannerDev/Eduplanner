#!/usr/bin/env tsx

/**
 * Script para limpiar registros fantasma en project_creations
 * 
 * Este script identifica y elimina registros en project_creations que:
 * 1. No tienen un proyecto correspondiente en la tabla proyectos
 * 2. O que tienen un proyecto que fue eliminado
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno desde .env
config()

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanOrphanedProjectCreations() {
  console.log('🧹 Iniciando limpieza de registros fantasma en project_creations...')
  
  try {
    // 1. Obtener todos los registros de project_creations
    console.log('📋 Obteniendo todos los registros de project_creations...')
    const { data: projectCreations, error: pcError } = await supabase
      .from('project_creations')
      .select('*')
    
    if (pcError) {
      console.error('❌ Error obteniendo project_creations:', pcError)
      return
    }
    
    console.log(`📊 Total de registros en project_creations: ${projectCreations?.length || 0}`)
    
    if (!projectCreations || projectCreations.length === 0) {
      console.log('✅ No hay registros para limpiar')
      return
    }
    
    // Mostrar todos los registros para análisis
    console.log('📋 Todos los registros en project_creations:')
    projectCreations.forEach((record, index) => {
      console.log(`  ${index + 1}. ID: ${record.id}, User: ${record.user_id}, Project: ${record.project_id}, Created: ${record.created_at}`)
    })
    
    // Agrupar por usuario
    const userCounts = new Map<string, number>()
    projectCreations.forEach(record => {
      const count = userCounts.get(record.user_id) || 0
      userCounts.set(record.user_id, count + 1)
    })
    
    console.log('📊 Conteo por usuario:')
    userCounts.forEach((count, userId) => {
      console.log(`  Usuario ${userId}: ${count} proyectos`)
    })
    
    // 2. Verificar cuáles proyectos existen
    console.log('🔍 Verificando qué proyectos existen...')
    const { data: existingProjects, error: projError } = await supabase
      .from('proyectos')
      .select('id')
    
    if (projError) {
      console.error('❌ Error obteniendo proyectos:', projError)
      return
    }
    
    const existingProjectIds = new Set(existingProjects?.map(p => p.id) || [])
    console.log(`📊 Total de proyectos existentes: ${existingProjectIds.size}`)
    
    // 3. Identificar registros fantasma
    const orphanedRecords = projectCreations.filter(pc => !existingProjectIds.has(pc.project_id))
    
    console.log(`🔍 Registros fantasma encontrados: ${orphanedRecords.length}`)
    
    if (orphanedRecords.length === 0) {
      console.log('✅ No se encontraron registros fantasma')
      return
    }
    
    // 4. Mostrar detalles de los registros fantasma
    console.log('📋 Detalles de registros fantasma:')
    orphanedRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. ID: ${record.id}, User: ${record.user_id}, Project: ${record.project_id}, Created: ${record.created_at}`)
    })
    
    // 5. SOLO MOSTRAR - NO ELIMINAR (MODO SEGURO)
    console.log('🔒 MODO SEGURO: Solo mostrando registros fantasma, NO eliminando')
    console.log('💡 Para eliminar estos registros, descomenta las líneas de eliminación en el script')
    
    // CÓDIGO COMENTADO PARA ELIMINACIÓN SEGURA:
    /*
    console.log('🗑️ Eliminando registros fantasma...')
    const orphanedIds = orphanedRecords.map(r => r.id)
    
    const { error: deleteError } = await supabase
      .from('project_creations')
      .delete()
      .in('id', orphanedIds)
    
    if (deleteError) {
      console.error('❌ Error eliminando registros fantasma:', deleteError)
      return
    }
    
    console.log(`✅ Se eliminaron ${orphanedRecords.length} registros fantasma`)
    */
    
    console.log('📊 Análisis completado - NO se eliminó nada')
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  }
}

// Ejecutar el script
cleanOrphanedProjectCreations()
  .then(() => {
    console.log('✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
