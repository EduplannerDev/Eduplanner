/**
 * API Route para resolver errores críticos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    
    const resolvedParams = await params
    
    // Verificar que el error existe
    const { data: existingError, error: fetchError } = await supabase
      .from('error_logs')
      .select('id')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError || !existingError) {
      return NextResponse.json(
        { error: 'Error not found' },
        { status: 404 }
      )
    }

    // Eliminar el error de la tabla (ya que no tenemos columna resolved)
    const { error } = await supabase
      .from('error_logs')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true,
      message: 'Error resolved and removed'
    })

  } catch (error) {
    console.error('Error resolving error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve error' },
      { status: 500 }
    )
  }
}
