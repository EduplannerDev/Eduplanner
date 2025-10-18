import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    console.log('Starting clear-old-errors request...')
    
    const supabase = createServiceClient()
    const body = await req.json()
    const { olderThanDays = 1, clearAll = false } = body

    console.log('Clear errors request:', { olderThanDays, clearAll })

    // Verificar que tenemos el service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    // Primero contar cuántos errores hay
    console.log('Counting logs...')
    let countQuery = supabase.from('error_logs').select('id', { count: 'exact', head: true })
    
    if (!clearAll) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
      console.log('Cutoff date:', cutoffDate.toISOString())
      countQuery = countQuery.lt('created_at', cutoffDate.toISOString())
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting logs:', countError)
      return NextResponse.json(
        { error: `Failed to count logs: ${countError.message}` },
        { status: 500 }
      )
    }

    console.log('Found logs to delete:', count)

    // Si no hay logs para eliminar, retornar éxito
    if (count === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: clearAll 
          ? 'No hay errores para eliminar'
          : `No hay errores más antiguos que ${olderThanDays} días`
      })
    }

    // Eliminar los logs
    console.log('Deleting logs...')
    let deleteQuery = supabase.from('error_logs').delete()
    
    if (!clearAll) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
      deleteQuery = deleteQuery.lt('created_at', cutoffDate.toISOString())
    } else {
      // Para clearAll, usar una condición que siempre sea verdadera
      deleteQuery = deleteQuery.gte('created_at', '1970-01-01T00:00:00Z')
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('Error deleting logs:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete logs: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('Successfully deleted logs')

    return NextResponse.json({
      success: true,
      deletedCount: count,
      message: clearAll 
        ? `Se eliminaron todos los ${count} errores`
        : `Se eliminaron ${count} errores más antiguos que ${olderThanDays} días`
    })

  } catch (error) {
    console.error('Error in clear-old-errors endpoint:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
