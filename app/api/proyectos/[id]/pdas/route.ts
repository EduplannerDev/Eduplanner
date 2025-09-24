import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: proyectoId } = await params

    if (!proyectoId) {
      return NextResponse.json(
        { error: "Se requiere el ID del proyecto" },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase con credenciales de servicio
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener PDAs asociados al proyecto
    const { data: pdasData, error: pdasError } = await supabase
      .from("proyecto_curriculo")
      .select(`
        id,
        curriculo_sep (
          id,
          pda,
          contenido,
          campo_formativo,
          grado,
          ejes_articuladores
        )
      `)
      .eq("proyecto_id", proyectoId)

    if (pdasError) {
      console.error("Error al obtener PDAs:", pdasError)
      return NextResponse.json(
        { error: "Error al obtener PDAs del proyecto" },
        { status: 500 }
      )
    }

    // Formatear los datos para el frontend
    const pdasFormateados = pdasData.map(item => ({
      id: item.curriculo_sep?.id,
      pda: item.curriculo_sep?.pda,
      contenido: item.curriculo_sep?.contenido,
      campo_formativo: item.curriculo_sep?.campo_formativo,
      grado: item.curriculo_sep?.grado,
      ejes_articuladores: item.curriculo_sep?.ejes_articuladores
    })).filter(item => item.id) // Filtrar elementos nulos

    return NextResponse.json(pdasFormateados)

  } catch (error) {
    console.error('Error en endpoint de PDAs:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}