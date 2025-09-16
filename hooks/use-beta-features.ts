"use client"

import { useEffect, useState } from 'react'
import { useAuth } from './use-auth'
import { supabase } from '@/lib/supabase'

export interface BetaFeature {
  feature_key: string
  feature_name: string
  description: string
  granted_at: string
  expires_at?: string
}

interface BetaFeaturesData {
  isBetaTester: boolean
  features: BetaFeature[]
  loading: boolean
  error: string | null
}

export function useBetaFeatures() {
  const { user } = useAuth()
  const [data, setData] = useState<BetaFeaturesData>({
    isBetaTester: false,
    features: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    async function fetchBetaFeatures() {
      if (!user?.id) {
        setData({
          isBetaTester: false,
          features: [],
          loading: false,
          error: null
        })
        return
      }

      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        // Verificar si el usuario es beta tester
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_beta_tester')
          .eq('id', user.id)
          .single()

        if (profileError) {
          throw new Error(`Error al verificar beta tester: ${profileError.message}`)
        }

        const isBetaTester = profile?.is_beta_tester || false

        if (!isBetaTester) {
          setData({
            isBetaTester: false,
            features: [],
            loading: false,
            error: null
          })
          return
        }

        // Obtener funcionalidades beta del usuario
        const { data: features, error: featuresError } = await supabase
          .rpc('get_user_beta_features', { user_id: user.id })

        if (featuresError) {
          throw new Error(`Error al obtener features beta: ${featuresError.message}`)
        }

        setData({
          isBetaTester: true,
          features: features || [],
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('Error fetching beta features:', error)
        setData({
          isBetaTester: false,
          features: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    fetchBetaFeatures()
  }, [user?.id])

  // Función para verificar si el usuario tiene acceso a una feature específica
  const hasFeatureAccess = (featureKey: string): boolean => {
    if (!data.isBetaTester) return false
    
    return data.features.some(feature => 
      feature.feature_key === featureKey && 
      (!feature.expires_at || new Date(feature.expires_at) > new Date())
    )
  }

  // Función para verificar si el usuario es beta tester
  const isBetaTester = (): boolean => {
    return data.isBetaTester
  }

  // Función para refrescar los datos
  const refresh = () => {
    if (user?.id) {
      setData(prev => ({ ...prev, loading: true }))
      // El useEffect se ejecutará automáticamente
    }
  }

  return {
    ...data,
    hasFeatureAccess,
    isBetaTester,
    refresh
  }
}

// Hook específico para verificar una feature individual
export function useBetaFeature(featureKey: string) {
  const { hasFeatureAccess, isBetaTester, loading, error } = useBetaFeatures()
  
  return {
    hasAccess: hasFeatureAccess(featureKey),
    isBetaTester: isBetaTester(),
    loading,
    error
  }
}

// Hook para verificar si el usuario es beta tester (más simple)
export function useBetaTesterCheck() {
  const { isBetaTester, loading, error } = useBetaFeatures()
  
  return {
    isBetaTester,
    loading,
    error
  }
}
