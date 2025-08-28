import { supabase } from "./supabase"

export interface Message {
  id: string
  user_id: string
  title: string
  content: string
  category: "conducta" | "academico" | "felicitaciones" | "citatorios"
  created_at: string
  updated_at: string
}

export interface MessageCreate {
  title: string
  content: string
  category: "conducta" | "academico" | "felicitaciones" | "citatorios"
}

// Obtener mensajes del usuario
export async function getMessagesByUser(userId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching messages:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMessagesByUser:", error)
    return []
  }
}

// Crear nuevo mensaje
export async function createMessage(userId: string, message: MessageCreate): Promise<Message | null> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        ...message,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createMessage:", error)
    return null
  }
}

// Eliminar mensaje
export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)

    if (error) {
      console.error("Error deleting message:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteMessage:", error)
    return false
  }
}

// Obtener mensaje específico
export async function getMessageById(messageId: string): Promise<Message | null> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single()

    if (error) {
      console.error("Error fetching message:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getMessageById:", error)
    return null
  }
}

// Actualizar mensaje
export async function updateMessage(messageId: string, updates: Partial<MessageCreate>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("messages")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId)

    if (error) {
      console.error("Error updating message:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateMessage:", error)
    return false
  }
}