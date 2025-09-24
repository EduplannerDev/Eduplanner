import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID del instrumento es requerido' },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase con credenciales de servicio para evitar RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar que el instrumento existe antes de eliminarlo
    const { data: instrumento, error: fetchError } = await supabase
      .from('instrumentos_evaluacion')
      .select('id, titulo')
      .eq('id', id)
      .single()

    if (fetchError || !instrumento) {
      return NextResponse.json(
        { error: 'Instrumento no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar el instrumento
    const { error: deleteError } = await supabase
      .from('instrumentos_evaluacion')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error al eliminar instrumento:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar el instrumento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Instrumento "${instrumento.titulo}" eliminado correctamente`
    })
  } catch (error) {
    console.error('Error en DELETE /api/instrumentos-evaluacion/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}