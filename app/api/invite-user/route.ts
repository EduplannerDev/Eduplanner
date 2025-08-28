import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(req: NextRequest) {
  try {
    const { email, plantelId, role, invitedBy } = await req.json()

    if (!email || !plantelId || !role || !invitedBy) {
      return NextResponse.json(
        { error: "Faltan parámetros obligatorios" },
        { status: 400 }
      )
    }

    // Verificar si el email ya está registrado
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado en el sistema' },
        { status: 400 }
      )
    }

    // Obtener información del plantel para incluir en los metadatos
    const { data: plantelInfo } = await supabaseAdmin
      .from('planteles')
      .select('nombre')
      .eq('id', plantelId)
      .single()

    // Invitar al usuario usando Supabase Auth Admin
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        plantel_id: plantelId,
        plantel_name: plantelInfo?.nombre || 'Plantel',
        role: role,
        invited_by: invitedBy
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=invite`
    })

    if (error) {
      console.error('Error inviting user:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Exception in invite-user API:', (error as Error).message)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}