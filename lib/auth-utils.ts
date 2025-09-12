/**
 * Utilidades para manejo de autenticación y errores de Supabase
 */

/**
 * Limpia completamente el estado de autenticación (para casos extremos)
 */
export function forceAuthReset() {
  if (typeof window !== 'undefined') {
    
    // Limpiar todo el localStorage y sessionStorage
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (error) {
      console.warn('Error clearing all storage:', error)
    }
    
    // Redirigir a / después de limpiar
    window.location.href = '/#error=auth_reset&error_description=Se%20ha%20reiniciado%20la%20autenticación.%20Por%20favor%20inicia%20sesión%20nuevamente.'
  }
}

/**
 * Limpia el localStorage de Supabase cuando hay errores de refresh token
 */
export function clearSupabaseStorage() {
  if (typeof window !== 'undefined') {
    // Limpiar todas las claves relacionadas con Supabase
    const keysToRemove = [
      'supabase.auth.token',
      'sb-hlcfzzuicafuqzhnhctg-auth-token', // Formato específico de tu proyecto
      'supabase.auth.refreshToken',
      'supabase.auth.expiresAt'
    ]
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      } catch (error) {
        console.warn(`Error removing ${key} from storage:`, error)
      }
    })
    
    // También limpiar cualquier clave que contenga 'supabase' o 'auth'
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Error removing ${key} from localStorage:`, error)
        }
      }
    })

    // Limpiar también sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        try {
          sessionStorage.removeItem(key)
        } catch (error) {
          console.warn(`Error removing ${key} from sessionStorage:`, error)
        }
      }
    })
  }
}

/**
 * Verifica si un error es relacionado con refresh token
 */
export function isRefreshTokenError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message || error.toString()
  const errorName = error.name || ''
  
  // Patrones de errores de refresh token más específicos
  const refreshTokenErrorPatterns = [
    'refresh_token_not_found',
    'Invalid Refresh Token',
    'Refresh Token Not Found',
    'AuthApiError',
    'invalid_grant',
    'Token has expired',
    'JWT expired',
    'refresh token is invalid',
    'session_not_found',
    'invalid_token',
    'token_expired'
  ]
  
  return refreshTokenErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
    errorName.toLowerCase().includes(pattern.toLowerCase())
  )
}

/**
 * Maneja errores de autenticación de forma centralizada
 */
export async function handleAuthError(error: any, supabaseClient: any) {
  console.warn('Auth error detected:', error)
  
  if (isRefreshTokenError(error)) {
    
    // Limpiar storage primero
    clearSupabaseStorage()
    
    // Cerrar sesión en Supabase de forma más agresiva
    try {
      // Intentar cerrar sesión normal
      await supabaseClient.auth.signOut({ scope: 'local' })
    } catch (signOutError) {
      console.warn('Error during local signOut:', signOutError)
      
      // Si falla, intentar cerrar sesión global
      try {
        await supabaseClient.auth.signOut({ scope: 'global' })
      } catch (globalSignOutError) {
        console.warn('Error during global signOut:', globalSignOutError)
      }
    }
    
    // Limpiar storage una vez más después del signOut
    clearSupabaseStorage()
    
    // Esperar un poco antes de recargar para asegurar que todo se limpie
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/?error=session_expired&error_description=Tu%20sesión%20ha%20expirado.%20Por%20favor%20inicia%20sesión%20nuevamente.'
      }
    }, 100)
  }
}

/**
 * Inicializa la sesión de forma segura, manejando tokens del hash
 */
export async function initializeSession(supabaseClient: any) {
  try {
    // Verificar si hay tokens de invitación en el hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const search = window.location.search
      
      
      // Verificar si hay parámetros de error en la URL
      const urlParams = new URLSearchParams(search)
      const errorParam = urlParams.get('error')
      if (errorParam) {
        console.log('🚨 initializeSession - Error detectado en URL:', errorParam)
        console.log('🚨 initializeSession - NO procesando tokens, permitiendo que el error se muestre')
        // Si hay un error en los parámetros, no procesar tokens y permitir que el error se muestre
        return null
      }
      
      if (hash && hash.includes('access_token') && hash.includes('type=invite')) {
        console.log('🔍 initializeSession - Tokens de invitación detectados en hash')
        
        // Parsear los tokens del hash para extraer información
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        
        if (accessToken && type === 'invite') {
          try {
            console.log('🔍 initializeSession - Validando token de invitación...')
            
            // Verificar que el token tenga la estructura básica de un JWT antes de procesarlo
            const tokenParts = accessToken.split('.')
            if (tokenParts.length !== 3) {
              console.error('❌ initializeSession - Token JWT malformado (no tiene 3 partes)')
              // Limpiar el hash para evitar loops infinitos
              window.history.replaceState(null, '', window.location.pathname)
              // Redirigir a / con parámetro de error específico
              window.location.href = '/?error=invalid_invitation_token&error_description=El%20token%20de%20invitación%20es%20inválido%20o%20está%20malformado'
              return null
            }
            
            // CRÍTICO: NO establecer sesión para invitaciones
            // Solo validar el token sin establecer sesión automáticamente
            console.log('🔍 initializeSession - Validando token SIN establecer sesión...')
            
            try {
              // Decodificar el token para extraer información del usuario SIN establecer sesión
              const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))
              
              // Verificar que el token no haya expirado
              const currentTime = Math.floor(Date.now() / 1000)
              if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                console.error('❌ initializeSession - Token de invitación expirado')
                window.history.replaceState(null, '', window.location.pathname)
                window.location.href = '/?error=expired_invitation_token&error_description=El%20token%20de%20invitación%20ha%20expirado'
                return null
              }
              
              console.log('✅ initializeSession - Token válido, procesando invitación SIN login automático...')
              
              // Guardar información de la invitación en sessionStorage
              sessionStorage.setItem('invitation_tokens', hash.substring(1)) // Guardar todos los tokens
              sessionStorage.setItem('invitation_email', tokenPayload.email || '')
              
              // Extraer información del plantel y rol si está disponible
              const userMetadata = tokenPayload.user_metadata || {}
              if (userMetadata.plantel_name) {
                sessionStorage.setItem('invitation_plantel_name', userMetadata.plantel_name)
              }
              if (userMetadata.plantel_id) {
                sessionStorage.setItem('invitation_plantel_id', userMetadata.plantel_id)
              }
              if (userMetadata.role) {
                sessionStorage.setItem('invitation_role', userMetadata.role)
              }
              if (userMetadata.invited_by) {
                sessionStorage.setItem('invitation_invited_by', userMetadata.invited_by)
              }
              
              // Limpiar el hash de la URL
              window.history.replaceState(null, '', window.location.pathname + window.location.search)
              
              // Redirigir a la página de configuración de contraseña
              window.location.href = '/invitation-setup'
              return null // No retornar sesión porque no debe estar logueado
              
            } catch (decodeError) {
              console.error('❌ initializeSession - Error decodificando token:', decodeError)
              window.history.replaceState(null, '', window.location.pathname)
              window.location.href = '/?error=invalid_invitation_token&error_description=El%20token%20de%20invitación%20es%20inválido'
              return null
            }
            
          } catch (error) {
            console.error('❌ initializeSession - Error procesando tokens de invitación:', error)
            // Limpiar el hash para evitar loops infinitos
            window.history.replaceState(null, '', window.location.pathname)
            // Redirigir a / con parámetro de error específico
            window.location.href = '/?error=invitation_processing_error&error_description=Error%20procesando%20el%20token%20de%20invitación'
            return null
          }
        }
      }
    }
    
    // Si no hay tokens de invitación, obtener sesión normal
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        
        // Si es un error de refresh token, manejarlo específicamente
        if (isRefreshTokenError(error)) {
          console.log('Refresh token error during session initialization, clearing storage...')
          clearSupabaseStorage()
          
          // Intentar obtener sesión una vez más después de limpiar
          try {
            const { data: { session: retrySession }, error: retryError } = await supabaseClient.auth.getSession()
            if (retryError && isRefreshTokenError(retryError)) {
              // Si sigue fallando, redirigir a /
              if (typeof window !== 'undefined') {
                window.location.href = '/?error=session_expired&error_description=Tu%20sesión%20ha%20expirado.%20Por%20favor%20inicia%20sesión%20nuevamente.'
              }
              return null
            }
            return retrySession
          } catch (retryError) {
            console.error('Retry session failed:', retryError)
            if (typeof window !== 'undefined') {
              window.location.href = '/?error=session_expired&error_description=Tu%20sesión%20ha%20expirado.%20Por%20favor%20inicia%20sesión%20nuevamente.'
            }
            return null
          }
        }
        
        throw error
      }
      
      return session
    } catch (sessionError) {
      console.error('Session error:', sessionError)
      
      // Si es un error de refresh token, limpiar y redirigir
      if (isRefreshTokenError(sessionError)) {
        clearSupabaseStorage()
        if (typeof window !== 'undefined') {
          window.location.href = '/?error=session_expired&error_description=Tu%20sesión%20ha%20expirado.%20Por%20favor%20inicia%20sesión%20nuevamente.'
        }
        return null
      }
      
      throw sessionError
    }
  } catch (error) {
    console.error('Unexpected error in initializeSession:', error)
    
    // Si es un error de refresh token, manejarlo
    if (isRefreshTokenError(error)) {
      clearSupabaseStorage()
      if (typeof window !== 'undefined') {
        window.location.href = '/?error=session_expired&error_description=Tu%20sesión%20ha%20expirado.%20Por%20favor%20inicia%20sesión%20nuevamente.'
      }
      return null
    }
    
    throw error
  }
}