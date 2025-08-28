import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { user_id, title, content, category, student_id } = await req.json()

    if (!user_id || !title || !content || !category) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    const messageData = {
      user_id,
      title,
      content,
      category,
      student_id: student_id || null,
      message_type: 'parent_message' // Identificador para mensajes de padres
    }

    console.log('Attempting to insert message data:', messageData)
    
    const { data, error } = await supabase.from("messages").insert([messageData])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Message saved successfully:', data)
    return NextResponse.json({ message: "Mensaje para padres guardado exitosamente", data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
