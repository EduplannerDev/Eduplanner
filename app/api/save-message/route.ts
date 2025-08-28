import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const { user_id, title, content, category, student_id } = await req.json()

    if (!user_id || !title || !content || !category) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    const messageData: any = {
      user_id,
      title,
      content,
      category,
    }

    // Agregar student_id si está disponible (para mensajes de padres)
    if (student_id) {
      messageData.student_id = student_id
    }

    const { data, error } = await supabase.from("messages").insert([messageData])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Mensaje guardado exitosamente", data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
