import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Crear cliente de Supabase con las cookies del usuario
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get("user_id")
  
  if (!user_id) {
      return NextResponse.json({ error: "User ID es requerido" }, { status: 400 })
    }

    // Verificar que el usuario solo pueda acceder a sus propios mensajes
    if (user_id !== user.id) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }


    
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API Messages] Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }


    return NextResponse.json(data)
  } catch (error) {
    console.error("[API Messages] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
