import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proyecto_id = searchParams.get('proyecto_id')

    if (!proyecto_id) {
      return NextResponse.json(
        { error: 'proyecto_id es requerido' },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase con credenciales de servicio para evitar RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener los instrumentos de evaluación del proyecto
    const { data: instrumentos, error } = await supabase
      .from('instrumentos_evaluacion')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener instrumentos:', error)
      return NextResponse.json(
        { error: 'Error al obtener los instrumentos de evaluación' },
        { status: 500 }
      )
    }

    return NextResponse.json(instrumentos || [])
  } catch (error) {
    console.error('Error en GET /api/instrumentos-evaluacion:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}