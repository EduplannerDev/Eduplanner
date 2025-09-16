import { createClient as createSupabaseClient } from "@supabase/supabase-js"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Configuración base para el cliente de Supabase
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    debug: false // Desactivado para limpiar logs
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': '@supabase/supabase-js'
    }
  }
}

export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseConfig
)

// Función para crear un cliente de Supabase (para uso en API routes)
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseConfig
  )
}

// Función para crear un cliente de Supabase con service role (para API routes)
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      ...supabaseConfig,
      auth: {
        ...supabaseConfig.auth,
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Agregar listener global para errores de autenticación
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    // Si hay un error de sesión, limpiar storage corrupto
    if (event === 'TOKEN_REFRESHED' && !session) {
      console.warn('Token refresh failed, clearing storage...')
      
      // Limpiar storage de forma segura
      try {
        const keysToRemove = [
          'supabase.auth.token',
          'sb-hlcfzzuicafuqzhnhctg-auth-token'
        ]
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        })
      } catch (error) {
        console.warn('Error clearing storage:', error)
      }
    }
  })
}
