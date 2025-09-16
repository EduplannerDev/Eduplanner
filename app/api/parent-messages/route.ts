import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    let supabase: any = null
    
    // Intentar autenticación con Bearer token primero
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      
      // Crear cliente con service role para verificar token
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: { user: tokenUser }, error: tokenError } = await serviceSupabase.auth.getUser(token)
      
      if (!tokenError && tokenUser) {
        user = tokenUser
        supabase = serviceSupabase
      }
    }
    
    // Si no hay Bearer token o falló, intentar con cookies
    if (!user) {
      const cookieStore = await cookies()
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      })
      
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !cookieUser) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      
      user = cookieUser
    }
    
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const student_id = searchParams.get('student_id')
    
    if (!user_id) {
      return NextResponse.json({ error: "User ID es requerido" }, { status: 400 })
    }

    // Verificar que el usuario solo pueda acceder a sus propios mensajes
    if (user_id !== user.id) {
      // Verificar si es administrador
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
      }
    }

    let query = supabase
      .from("parent_messages")
      .select("*")
      .order("created_at", { ascending: false })

    // Si se especifica un student_id, filtrar por ese estudiante
    // En este caso, queremos TODOS los mensajes del alumno, no solo los del usuario actual
    if (student_id) {
      query = query.eq("alumno_id", student_id)
    } else {
      // Si no hay student_id, mostrar solo los mensajes del usuario actual
      query = query.eq("user_id", user_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}