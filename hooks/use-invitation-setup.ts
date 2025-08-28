'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface InvitationInfo {
  email: string
  plantelName?: string
  role?: string
  plantelId?: string
  invitedBy?: string
}

interface UseInvitationSetupReturn {
  user: User | null
  invitationInfo: InvitationInfo | null
  isLoading: boolean
  error: string | null
  needsSetup: boolean
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
}

export function useInvitationSetup(): UseInvitationSetupReturn {
  const [user, setUser] = useState<User | null>(null)
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(true) // Por defecto necesita configuración

  useEffect(() => {
    const checkInvitationInfo = async () => {
      try {
        // Obtener información de invitación desde la API (cookies httpOnly)
        const response = await fetch('/api/invitation')
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('No se encontró información de invitación válida')
          } else {
            setError('Error al obtener información de invitación')
          }
          return
        }
        
        const invitationData = await response.json()
        
        // Configurar la información de la invitación
        setInvitationInfo({
          email: invitationData.email,
          plantelName: invitationData.plantelName || undefined,
          role: undefined, // Se puede extraer del token si es necesario
          plantelId: undefined,
          invitedBy: undefined
        })

        // Guardar tokens temporalmente para uso posterior
        if (invitationData.tokens) {
          sessionStorage.setItem('invitation_tokens', JSON.stringify(invitationData.tokens))
        }

      } catch (error) {
        console.error('Error checking invitation info:', error)
        setError('Error al verificar información de invitación')
      } finally {
        setIsLoading(false)
      }
    }

    checkInvitationInfo()
  }, [])

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      setError(null)

      // Establecer la sesión con los tokens de invitación
      const invitationTokens = sessionStorage.getItem('invitation_tokens')
      if (!invitationTokens) {
        throw new Error('No se encontraron tokens de invitación')
      }

      const tokens = JSON.parse(invitationTokens)
      await supabase.auth.setSession(tokens)

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      // Limpiar tokens de invitación del sessionStorage
      sessionStorage.removeItem('invitation_tokens')

      // Limpiar cookies de invitación usando la API
      try {
        await fetch('/api/invitation', { method: 'DELETE' })
      } catch (cleanupError) {
        console.warn('Error limpiando cookies de invitación:', cleanupError)
        // No fallar por esto, ya que la contraseña se actualizó correctamente
      }

      return { success: true }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar la contraseña'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Para OAuth con invitación, necesitamos manejar esto de manera diferente
      // Por ahora, retornamos un error indicando que no está implementado
      return { 
        success: false, 
        error: 'La autenticación con Google para invitaciones aún no está implementada' 
      }
    } catch (error) {
      return { success: false, error: 'Error al conectar con Google' }
    }
  }

  return {
    user,
    invitationInfo,
    isLoading,
    error,
    needsSetup,
    updatePassword,
    signInWithGoogle
  }
}