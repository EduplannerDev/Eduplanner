import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get("user_id")
    const student_id = searchParams.get("student_id")

    if (!user_id) {
      return NextResponse.json({ error: "User ID es requerido" }, { status: 400 })
    }

    let query = supabase
      .from("messages")
      .select("*")
      .eq("user_id", user_id)
      .eq("message_type", "parent_message") // Solo mensajes de padres
      .order("created_at", { ascending: false })

    // Si se especifica un student_id, filtrar por ese estudiante
    if (student_id) {
      query = query.eq("student_id", student_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}