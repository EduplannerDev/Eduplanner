import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Obtener información de la invitación desde las cookies
    const invitationEmail = cookieStore.get('invitation_email')?.value
    const invitationTokens = cookieStore.get('invitation_tokens')?.value
    const invitationPlantelName = cookieStore.get('invitation_plantel_name')?.value
    
    if (!invitationEmail || !invitationTokens) {
      return NextResponse.json(
        { error: 'No hay información de invitación disponible' },
        { status: 404 }
      )
    }
    
    let tokens
    try {
      tokens = JSON.parse(invitationTokens)
    } catch (parseError) {
      console.error('Error parsing invitation tokens:', parseError)
      return NextResponse.json(
        { error: 'Información de invitación inválida' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      email: invitationEmail,
      plantelName: invitationPlantelName || null,
      tokens: tokens
    })
    
  } catch (error) {
    console.error('Error getting invitation info:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Limpiar las cookies de invitación
    const response = NextResponse.json({ success: true })
    
    response.cookies.set('invitation_email', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Eliminar inmediatamente
    })
    
    response.cookies.set('invitation_tokens', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Eliminar inmediatamente
    })
    
    response.cookies.set('invitation_plantel_name', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Eliminar inmediatamente
    })
    
    return response
    
  } catch (error) {
    console.error('Error clearing invitation cookies:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}