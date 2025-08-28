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
      console.log("[API Messages] Authentication error:", authError?.message || "No user")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get("user_id")

    console.log("[API Messages] Request received for user_id:", user_id)
    console.log("[API Messages] Authenticated user:", user.id)

    if (!user_id) {
      console.log("[API Messages] Error: No user_id provided")
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
      
      if (!profile || profile.role !== "administrador") {
        console.log("[API Messages] Access denied: User trying to access other user's messages")
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
      }
    }

    console.log("[API Messages] Attempting to query messages table...")
    
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

    console.log("[API Messages] Query successful, found", data?.length || 0, "messages")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API Messages] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
