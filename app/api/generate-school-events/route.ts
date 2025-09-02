import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7) // Remover 'Bearer '
    
    // Crear cliente de Supabase con service role para operaciones administrativas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables de entorno de Supabase no encontradas')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verificar el token del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Llamar a la función de Supabase para agregar eventos del calendario escolar
    const { data, error } = await supabase.rpc('add_school_calendar_to_new_user', {
      p_user_id: user.id
    })

    if (error) {
      console.error('Error al generar eventos SEP:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al generar eventos del calendario escolar: ' + error.message 
        },
        { status: 500 }
      )
    }

    // Contar cuántos eventos se agregaron
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'Calendario Escolar')

    return NextResponse.json({
      success: true,
      message: 'Eventos del calendario escolar generados exitosamente',
      eventsCount: count || 0
    })

  } catch (error) {
    console.error('Error inesperado al generar eventos SEP:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error inesperado al generar eventos del calendario escolar' 
      },
      { status: 500 }
    )
  }
}