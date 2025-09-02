import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

async function checkAndCleanDuplicateSchoolEvents() {
  try {
    console.log('============================================================')
    console.log('VERIFICACIÓN Y LIMPIEZA DE EVENTOS DEL CALENDARIO ESCOLAR')
    console.log('============================================================')
    
    const supabase = getSupabaseClient()
    
    // Primero, verificar el total de eventos
    const { count: totalEvents, error: totalError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      throw totalError
    }
    
    console.log(`Total de eventos en la base de datos: ${totalEvents}`)
    
    // Verificar eventos del calendario escolar usando diferentes métodos
    console.log('\nBuscando eventos del calendario escolar...')
    
    // Método 1: usando overlaps
    const { data: schoolEvents1, error: error1 } = await supabase
      .from('events')
      .select('id, title, hashtags, user_id, event_date, created_at')
      .overlaps('hashtags', ['#calendario-escolar'])
    
    console.log(`Eventos encontrados con overlaps: ${schoolEvents1?.length || 0}`)
    
    // Método 2: usando contains
    const { data: schoolEvents2, error: error2 } = await supabase
      .from('events')
      .select('id, title, hashtags, user_id, event_date, created_at')
      .contains('hashtags', ['#calendario-escolar'])
    
    console.log(`Eventos encontrados con contains: ${schoolEvents2?.length || 0}`)
    
    // Método 3: buscar cualquier evento que contenga "calendario" en hashtags
    const { data: allEvents, error: error3 } = await supabase
      .from('events')
      .select('id, title, hashtags, user_id, event_date, created_at')
    
    if (error3) {
      throw error3
    }
    
    const schoolEvents3 = allEvents?.filter(event => 
      event.hashtags && event.hashtags.some((tag: string) => tag.includes('calendario'))
    ) || []
    
    console.log(`Eventos encontrados con filtro manual: ${schoolEvents3.length}`)
    
    // Usar el método que encuentre más eventos
    let schoolEvents = schoolEvents1
    if (schoolEvents2 && schoolEvents2.length > (schoolEvents1?.length || 0)) {
      schoolEvents = schoolEvents2
    }
    if (schoolEvents3.length > (schoolEvents?.length || 0)) {
      schoolEvents = schoolEvents3
    }
    
    console.log(`\nUsando ${schoolEvents?.length || 0} eventos del calendario escolar para análisis`)
    
    if (!schoolEvents || schoolEvents.length === 0) {
      console.log('\n⚠️  No se encontraron eventos del calendario escolar.')
      console.log('Esto puede significar que:')
      console.log('1. Los eventos no tienen el hashtag #calendario-escolar')
      console.log('2. Los eventos fueron eliminados previamente')
      console.log('3. Hay un problema con la consulta')
      
      // Mostrar algunos eventos de ejemplo
      const { data: sampleEvents } = await supabase
        .from('events')
        .select('id, title, hashtags')
        .limit(5)
      
      console.log('\nEjemplos de eventos en la base de datos:')
      sampleEvents?.forEach(event => {
        console.log(`- "${event.title}" con hashtags: ${JSON.stringify(event.hashtags)}`)
      })
      
      return
    }
    
    // Mostrar algunos eventos encontrados
    console.log('\nEjemplos de eventos del calendario escolar encontrados:')
    schoolEvents.slice(0, 5).forEach(event => {
      console.log(`- "${event.title}" (${event.event_date}) - Usuario: ${event.user_id}`)
    })
    
    // Agrupar eventos por usuario, título y fecha para encontrar duplicados
    const eventGroups = new Map<string, any[]>()
    
    schoolEvents.forEach(event => {
      const key = `${event.user_id}-${event.title}-${event.event_date}`
      if (!eventGroups.has(key)) {
        eventGroups.set(key, [])
      }
      eventGroups.get(key)!.push(event)
    })
    
    // Identificar eventos duplicados
    const eventsToDelete: string[] = []
    let duplicatesFound = 0
    
    console.log('\nAnalizando duplicados...')
    eventGroups.forEach((groupEvents, key) => {
      if (groupEvents.length > 1) {
        duplicatesFound += groupEvents.length - 1
        // Mantener el primer evento (más antiguo) y marcar el resto para eliminación
        const [keep, ...duplicates] = groupEvents.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        duplicates.forEach(event => {
          eventsToDelete.push(event.id)
        })
        console.log(`📋 "${groupEvents[0].title}": ${groupEvents.length} copias, eliminando ${duplicates.length}`)
      }
    })
    
    console.log(`\n📊 Resumen:`)
    console.log(`- Eventos únicos: ${eventGroups.size}`)
    console.log(`- Eventos duplicados a eliminar: ${eventsToDelete.length}`)
    
    if (eventsToDelete.length === 0) {
      console.log('\n✅ No se encontraron eventos duplicados. La base de datos está limpia.')
      return
    }
    
    console.log(`\n🧹 Eliminando ${eventsToDelete.length} eventos duplicados...`)
    
    // Eliminar eventos duplicados en lotes
    const batchSize = 50
    let deletedCount = 0
    
    for (let i = 0; i < eventsToDelete.length; i += batchSize) {
      const batch = eventsToDelete.slice(i, i + batchSize)
      
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .in('id', batch)
      
      if (deleteError) {
        console.error(`Error eliminando lote ${i / batchSize + 1}:`, deleteError)
        throw deleteError
      }
      
      deletedCount += batch.length
      console.log(`✅ Eliminados ${deletedCount}/${eventsToDelete.length} eventos duplicados...`)
    }
    
    // Verificar resultado final
    const { data: finalEvents } = await supabase
      .from('events')
      .select('id')
      .overlaps('hashtags', ['#calendario-escolar'])
    
    console.log('\n============================================================')
    console.log('✅ LIMPIEZA COMPLETADA EXITOSAMENTE')
    console.log('============================================================')
    console.log(`Eventos eliminados: ${deletedCount}`)
    console.log(`Eventos restantes del calendario escolar: ${finalEvents?.length || 0}`)
    console.log('Los eventos duplicados han sido eliminados correctamente.')
    
  } catch (error) {
    console.error('\n============================================================')
    console.error('❌ ERROR EN LA VERIFICACIÓN/LIMPIEZA')
    console.error('============================================================')
    console.error('Error:', error)
    throw error
  }
}

// Ejecutar la verificación y limpieza
checkAndCleanDuplicateSchoolEvents()
  .then(() => {
    console.log('\nProceso finalizado.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error en el proceso:', error)
    process.exit(1)
  })