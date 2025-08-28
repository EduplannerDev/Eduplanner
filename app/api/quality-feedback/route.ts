import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planeacion_content, quality_rating, feedback_text, user_id } = body

    // Validar datos requeridos
    if (!planeacion_content || !quality_rating || !user_id) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Insertar el feedback en la base de datos
    const { data, error } = await supabase
      .from('quality_feedback')
      .insert({
        planeacion_content,
        quality_rating,
        feedback_text: feedback_text || null,
        user_id,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error al guardar feedback:', error)
      return NextResponse.json(
        { error: 'Error al guardar el feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Feedback guardado exitosamente', data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en el endpoint de quality-feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}