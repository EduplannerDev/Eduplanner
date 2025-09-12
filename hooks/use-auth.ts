"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { handleAuthError, initializeSession, isRefreshTokenError } from "@/lib/auth-utils"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const session = await initializeSession(supabase)
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        
        if (mounted) {
          // Si es un error de refresh token, manejarlo
          if (isRefreshTokenError(error)) {
            await handleAuthError(error, supabase)
          }
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      console.warn('Error signing out:', error)
      
      // Si es un error de refresh token durante el signOut, limpiar manualmente
      if (isRefreshTokenError(error)) {
        await handleAuthError(error, supabase)
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    signOut,
  }
}
