import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function DELETE(request: NextRequest) {
  try {
    // Crear cliente de Supabase con service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Verificar autenticación con el token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener el ID del proyecto de la URL
    const url = new URL(request.url)
    const proyectoId = url.searchParams.get('id')

    if (!proyectoId) {
      return NextResponse.json(
        { error: 'ID del proyecto requerido' },
        { status: 400 }
      )
    }


    // Verificar que el proyecto pertenece al usuario
    const { data: proyecto, error: proyectoError } = await supabase
      .from('proyectos')
      .select('id, nombre, profesor_id')
      .eq('id', proyectoId)
      .eq('profesor_id', user.id)
      .single()

    if (proyectoError || !proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado o sin permisos' },
        { status: 404 }
      )
    }

    // Eliminar el proyecto (las relaciones se eliminan automáticamente por CASCADE)
    const { error: deleteError } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', proyectoId)
      .eq('profesor_id', user.id)

    if (deleteError) {
      console.error('❌ Error eliminando proyecto:', deleteError)
      return NextResponse.json(
        { error: 'Error eliminando el proyecto' },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      message: `Proyecto "${proyecto.nombre}" eliminado exitosamente`
    })

  } catch (error) {
    console.error('❌ Error en delete proyecto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
