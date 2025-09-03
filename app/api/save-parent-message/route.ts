import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { user_id, title, content, category, student_id } = await req.json()

    if (!user_id || !title || !content) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Debug: Check user's role and permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, plantel_id')
      .eq('id', user_id)
      .single()
    
    console.log('User profile:', userProfile)
    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: "Error al verificar permisos de usuario" }, { status: 500 })
    }

    let grupo_id = null
    const alumno_id = student_id // Definir en el scope correcto
    
    // Si hay student_id, obtener el grupo_id del estudiante
    if (student_id) {
      // First, get groups the user has access to
      let accessibleGroupIds = []
      if (userProfile.role === 'administrador') {
        // Admin has access to all groups
        const { data: allGroups } = await supabase
          .from('grupos')
          .select('id')
        accessibleGroupIds = allGroups?.map(g => g.id) || []
      } else if (userProfile.role === 'director') {
          // Director has access to groups in their plantel
          console.log('Director plantel_id:', userProfile.plantel_id)
          const { data: plantelGroups, error: groupsError } = await supabase
            .from('grupos')
            .select('id, nombre, plantel_id')
            .eq('plantel_id', userProfile.plantel_id)
          console.log('Director plantel groups:', plantelGroups, 'Error:', groupsError)
          
          // Also check if there are any groups at all in the system
          const { data: allGroupsCheck } = await supabase
            .from('grupos')
            .select('id, nombre, plantel_id')
            .limit(5)
          console.log('Sample groups in system:', allGroupsCheck)
          
          accessibleGroupIds = plantelGroups?.map(g => g.id) || []
      } else if (userProfile.role === 'profesor') {
        // Professor has access to their own groups
        console.log('Professor user_id:', user_id)
        const { data: teacherGroups, error: teacherGroupsError } = await supabase
          .from('grupos')
          .select('id, nombre, user_id, plantel_id')
          .eq('user_id', user_id)
        console.log('Professor groups:', teacherGroups, 'Error:', teacherGroupsError)
        
        // Also check if there are any groups at all in the system
        const { data: allGroupsCheck } = await supabase
          .from('grupos')
          .select('id, nombre, user_id, plantel_id')
          .limit(5)
        console.log('Sample groups in system:', allGroupsCheck)
        
        accessibleGroupIds = teacherGroups?.map(g => g.id) || []
      }
      
      console.log('Accessible group IDs:', accessibleGroupIds)
      console.log('Looking for alumno_id:', alumno_id)
      
      // First, let's check if the student exists at all
      const { data: studentExists } = await supabase
        .from('alumnos')
        .select('id, grupo_id')
        .eq('id', alumno_id)
        .single()
      console.log('Student exists check:', studentExists)
      
      // Now query the student with accessible group filter
      const { data: studentData, error: studentError } = await supabase
        .from('alumnos')
        .select(`
          grupo_id, 
          nombre_completo,
          grupos(
            id,
            nombre,
            plantel_id,
            user_id
          )
        `)
        .eq('id', alumno_id)
        .in('grupo_id', accessibleGroupIds)
        .maybeSingle()
      
      console.log('Student data:', studentData)
      if (studentError) {
        console.error('Error fetching student grupo_id:', studentError)
        return NextResponse.json({ error: "Error al obtener datos del estudiante" }, { status: 500 })
      } else if (studentData) {
        grupo_id = studentData.grupo_id
        const groupInfo = studentData.grupos
        
        // Debug: Check if user has permissions for this group
        if (grupo_id && groupInfo && Array.isArray(groupInfo) && groupInfo.length > 0) {
          console.log('Group data:', groupInfo[0])
          
          // Verificar permisos según el rol
          const hasPermission = 
            userProfile.role === 'administrador' ||
            (userProfile.role === 'director' && userProfile.plantel_id === groupInfo[0].plantel_id) ||
            (userProfile.role === 'profesor' && groupInfo[0].user_id === user_id)
          
          if (!hasPermission) {
            console.error('User does not have permission for this group')
            return NextResponse.json({ error: "No tienes permisos para enviar mensajes a este estudiante" }, { status: 403 })
          }
          
          console.log('User has permission for group:', hasPermission)
        }
      }
    }

    const messageData = {
      user_id,
      title,
      content,
      message_type: category || 'general',
      alumno_id: student_id || null,
      delivery_method: 'manual'
    }

    console.log('Attempting to insert parent message data:', messageData)
    
    const { data, error } = await supabase.from("parent_messages").insert([messageData])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Parent message saved successfully:', data)
    return NextResponse.json({ message: "Mensaje para padres guardado exitosamente", data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
