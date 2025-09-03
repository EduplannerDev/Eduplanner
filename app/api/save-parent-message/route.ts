import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(req: NextRequest) {
  try {
    const { user_id, title, content, category, student_id } = await req.json()

    if (!user_id || !title || !content) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Verificar que el usuario tenga un rol válido
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single()
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: "Error al verificar permisos de usuario" }, { status: 500 })
    }

    // Verificar que el usuario tenga un rol autorizado
    if (!['administrador', 'director', 'profesor'].includes(userProfile.role)) {
      return NextResponse.json({ error: "No tienes permisos para enviar mensajes" }, { status: 403 })
    }

    // Si hay student_id, verificar que el alumno existe y que el usuario tiene permisos
    if (student_id) {
      console.log('Validating student_id:', student_id)
      
      // Verificar que el alumno existe y que el usuario tiene acceso a través de sus grupos
      const { data: studentWithGroup, error: studentError } = await supabase
        .from('alumnos')
        .select(`
          id, 
          nombre_completo,
          grupo_id,
          grupos!grupo_id (
            id,
            user_id
          )
        `)
        .eq('id', student_id)
        .single()
      
      if (studentError) {
        console.error('Student validation error:', studentError)
        return NextResponse.json({ 
          error: "El alumno especificado no existe en la base de datos",
          details: studentError.message 
        }, { status: 400 })
      }
      
      if (!studentWithGroup) {
        console.error('Student not found with ID:', student_id)
        return NextResponse.json({ 
          error: "El alumno especificado no existe en la base de datos" 
        }, { status: 400 })
      }
      
      // Verificar que el usuario tiene permisos sobre el grupo del alumno
      const grupo = Array.isArray(studentWithGroup.grupos) ? studentWithGroup.grupos[0] : studentWithGroup.grupos
      if (grupo && grupo.user_id !== user_id) {
        console.error('User does not have permission for student:', { user_id, student_id, group_owner: grupo.user_id })
        return NextResponse.json({ 
          error: "No tienes permisos para enviar mensajes a este alumno" 
        }, { status: 403 })
      }
      
      console.log('Student validated successfully:', studentWithGroup.nombre_completo)
    }

    // Insert the message
    const { data: messageData, error: insertError } = await supabase
      .from('parent_messages')
      .insert({
        user_id,
        alumno_id: student_id,
        title,
        content,
        message_type: category || 'general',
        delivery_method: 'manual'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Supabase error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log('Parent message saved successfully:', messageData)
    return NextResponse.json({ message: "Mensaje para padres guardado exitosamente", data: messageData })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
