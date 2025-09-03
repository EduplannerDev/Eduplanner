import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { messageId, userId } = body

    if (!messageId || !userId) {
      return NextResponse.json({ error: "Faltan parámetros obligatorios" }, { status: 400 })
    }

    // Intentar eliminar de la tabla messages primero
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .match({ id: messageId, user_id: userId })

    // Si no se encontró en messages, intentar en parent_messages
    if (messagesError || messagesError === null) {
      const { error: parentMessagesError } = await supabase
        .from("parent_messages")
        .delete()
        .match({ id: messageId, user_id: userId })

      if (parentMessagesError) {
        return NextResponse.json({ error: parentMessagesError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "Mensaje eliminado exitosamente" })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
