"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

interface ContextoTrabajo {
  id: string
  grado: number
  ciclo_escolar: string
  fecha_inicio: string
  notas?: string
}

export function useContextoTrabajo() {
  const { user } = useAuth()
  const [contexto, setContexto] = useState<ContextoTrabajo | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasContexto, setHasContexto] = useState(false)

  useEffect(() => {
    if (user?.id) {
      cargarContextoTrabajo()
    } else {
      setContexto(null)
      setHasContexto(false)
      setLoading(false)
    }
  }, [user?.id])

  const cargarContextoTrabajo = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      console.log('🔍 [DEBUG] Verificando contexto para usuario:', user.id)
      
      const { data, error } = await supabase
        .rpc('get_contexto_trabajo_activo', { profesor_id_param: user.id })

      console.log('📊 [DEBUG] Respuesta RPC:', { data, error })

      if (error) {
        console.error('❌ [DEBUG] Error cargando contexto de trabajo:', error)
        setHasContexto(false)
        return
      }

      if (data && data.length > 0) {
        console.log('✅ [DEBUG] Usuario TIENE contexto:', data[0])
        setContexto(data[0])
        setHasContexto(true)
        console.log('🔄 [DEBUG] Estado hasContexto actualizado a: true')
      } else {
        console.log('⚠️ [DEBUG] Usuario NO tiene contexto')
        setContexto(null)
        setHasContexto(false)
        console.log('🔄 [DEBUG] Estado hasContexto actualizado a: false')
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error:', error)
      setHasContexto(false)
    } finally {
      setLoading(false)
    }
  }

  const actualizarContexto = () => {
    cargarContextoTrabajo()
  }

  return {
    contexto,
    hasContexto,
    loading,
    actualizarContexto
  }
}
