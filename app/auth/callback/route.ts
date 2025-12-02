import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { checkInvitationStatus } from '@/lib/invitations'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const type = requestUrl.searchParams.get('type') // Para detectar invitaciones


  // Verificar si hay errores en los parámetros de la URL
  const error = requestUrl.searchParams.get('error')
  const errorCode = requestUrl.searchParams.get('error_code')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Manejar errores específicos de Supabase
  if (error) {
    console.error('Auth error from Supabase:', { error, errorCode, errorDescription })

    let errorMessage = 'Error de autenticación'

    switch (error) {
      case 'access_denied':
        errorMessage = 'Acceso denegado. No tienes permisos para acceder.'
        break
      case 'server_error':
        errorMessage = 'Error del servidor. Inténtalo de nuevo más tarde.'
        break
      case 'temporarily_unavailable':
        errorMessage = 'Servicio temporalmente no disponible. Inténtalo más tarde.'
        break
      default:
        if (errorDescription) {
          if (errorDescription.includes('expired') || errorDescription.includes('invalid')) {
            errorMessage = '🚫 Tu invitación ha EXPIRADO. Solicita una nueva invitación al administrador del plantel.'
          } else if (errorDescription.includes('Email link is invalid')) {
            errorMessage = '🚫 El enlace de invitación es INVÁLIDO. Solicita una nueva invitación.'
          } else {
            errorMessage = `Error: ${errorDescription}`
          }
        }
        break
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/?error=${encodeURIComponent(errorMessage)}`
    )
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      // Si es una invitación, manejar de manera especial
      if (type === 'invite') {




        // Crear un cliente Supabase SIN cookies para evitar establecer sesión automáticamente
        const supabaseNoSession = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: false, // CRÍTICO: No persistir la sesión
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          }
        )

        // Intercambiar código por sesión TEMPORALMENTE para validar
        const { data, error } = await supabaseNoSession.auth.exchangeCodeForSession(code)

        if (error) {
          console.error('Error validating invitation code:', error)

          let errorMessage = 'Error de autenticación'

          switch (error.message) {
            case 'Invalid code':
              errorMessage = '🚫 Código de invitación INVÁLIDO. El enlace puede haber expirado.'
              break
            case 'Code expired':
              errorMessage = '🚫 Tu invitación ha EXPIRADO. Solicita una nueva invitación al administrador.'
              break
            case 'Email link is invalid or has expired':
              errorMessage = '🚫 Tu invitación ha EXPIRADO o es inválida. Solicita una nueva invitación.'
              break
            default:
              if (error.message.includes('expired')) {
                errorMessage = '🚫 Tu invitación ha EXPIRADO. Solicita una nueva invitación al administrador.'
              } else if (error.message.includes('invalid')) {
                errorMessage = '🚫 El enlace de invitación es INVÁLIDO. Solicita una nueva invitación.'
              } else {
                errorMessage = `Error de autenticación: ${error.message}`
              }
              break
          }

          return NextResponse.redirect(
            `${requestUrl.origin}/?error=${encodeURIComponent(errorMessage)}`
          )
        }

        if (data.user && data.session) {


          // Crear una respuesta que redirige a invitation-setup con la información necesaria
          const response = NextResponse.redirect(`${requestUrl.origin}/invitation-setup`)

          // IMPORTANTE: Limpiar cualquier cookie de sesión que pueda haberse establecido
          response.cookies.delete('sb-access-token')
          response.cookies.delete('sb-refresh-token')
          response.cookies.set('sb-access-token', '', { maxAge: 0 })
          response.cookies.set('sb-refresh-token', '', { maxAge: 0 })

          // Guardar información de la invitación en cookies temporales (más seguro que sessionStorage para SSR)
          response.cookies.set('invitation_email', data.user.email || '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 30 // 30 minutos
          })

          response.cookies.set('invitation_tokens', JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 30 // 30 minutos
          })

          // Intentar obtener información adicional del perfil si existe
          try {
            const { data: profileData } = await supabaseNoSession
              .from('profiles')
              .select('plantel_id, planteles(nombre)')
              .eq('id', data.user.id)
              .single()

            if (profileData?.planteles) {
              const plantelName = Array.isArray(profileData.planteles)
                ? profileData.planteles[0]?.nombre
                : (profileData.planteles as any)?.nombre

              if (plantelName) {
                response.cookies.set('invitation_plantel_name', plantelName, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  maxAge: 60 * 30
                })
              }
            }
          } catch (profileError) {

          }

          return response
        }
      }

      // Flujo normal para autenticación que NO es invitación
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent('Error de autenticación')}`)
      }

      // Construir la URL de redirección con los tokens en el hash para que el cliente los recoja
      // Esto es necesario porque no estamos usando cookies de sesión persistentes en el servidor
      const redirectUrl = new URL(next, requestUrl.origin)
      if (data.session) {
        const hashParams = new URLSearchParams()
        hashParams.set('access_token', data.session.access_token)
        hashParams.set('refresh_token', data.session.refresh_token)
        hashParams.set('expires_in', data.session.expires_in.toString())
        hashParams.set('token_type', data.session.token_type)
        hashParams.set('type', 'signup') // Asumimos signup, supabase-js lo manejará

        redirectUrl.hash = hashParams.toString()
      }

      // Flujo normal para otros tipos de autenticación
      return NextResponse.redirect(redirectUrl)

    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent('Error inesperado de autenticación')}`)
    }
  }

  // Sin código, verificar si hay parámetros de error en la URL
  const urlError = requestUrl.searchParams.get('error')
  if (urlError) {
    const errorDescription = requestUrl.searchParams.get('error_description')
    let errorMessage = 'Error de autenticación'

    if (errorDescription) {
      if (errorDescription.includes('expired')) {
        errorMessage = 'El enlace ha expirado. Solicita una nueva invitación.'
      } else if (errorDescription.includes('invalid')) {
        errorMessage = 'El enlace es inválido. Verifica que hayas usado el enlace correcto.'
      } else {
        errorMessage = errorDescription
      }
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorMessage)}`
    )
  }

  // Sin código y sin errores específicos, redirigir con mensaje genérico
  return NextResponse.redirect(
    `${requestUrl.origin}/?error=${encodeURIComponent('No se recibió código de autenticación. Inténtalo de nuevo.')}`
  )
}