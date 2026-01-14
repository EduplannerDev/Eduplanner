"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

interface ContextoTrabajo {
  id: string
  grado: number
  ciclo_escolar: string
  fecha_inicio: string
  notas?: string
}

interface AvailableContext {
  id: string
  grado: number
  ciclo_escolar: string
  selected: boolean
  created_at: string
}

export function useContextoTrabajo() {
  const { user } = useAuth()
  const [contexto, setContexto] = useState<ContextoTrabajo | null>(null)
  const [availableContexts, setAvailableContexts] = useState<AvailableContext[]>([])
  const [loading, setLoading] = useState(true)
  const [hasContexto, setHasContexto] = useState(false)

  const cargarContextoTrabajo = useCallback(async () => {
    if (!user?.id) {
      setContexto(null)
      setHasContexto(false)
      setAvailableContexts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 1. Obtener el contexto activo seleccionado (current)
      const { data: currentData, error: currentError } = await supabase
        .rpc('get_contexto_trabajo_activo', { profesor_id_param: user.id })

      if (currentError) throw currentError

      // 2. Obtener todos los contextos disponibles (para el switch)
      const { data: allData, error: allError } = await supabase
        .rpc('get_available_contexts', { profesor_id_param: user.id })

      if (allError) throw allError

      if (currentData && currentData.length > 0) {
        setContexto(currentData[0])
        setHasContexto(true)
      } else {
        setContexto(null)
        setHasContexto(false)
      }

      if (allData) {
        setAvailableContexts(allData)
      }

    } catch (error) {
      console.error('Error cargando contexto:', error)
      setHasContexto(false)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    cargarContextoTrabajo()
  }, [cargarContextoTrabajo])

  const actualizarContexto = () => {
    cargarContextoTrabajo()
  }

  const switchContext = async (contextId: string) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase.rpc('switch_context', {
        profesor_id_param: user.id,
        context_id_param: contextId
      })

      if (error) throw error

      toast.success('Contexto cambiado correctamente')
      await cargarContextoTrabajo()
      return true
    } catch (error: any) {
      console.error('Error switching context:', error)
      toast.error('Error al cambiar de grado: ' + error.message)
      return false
    }
  }

  const deactivateContext = async (contextId: string) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase.rpc('deactivate_context', {
        profesor_id_param: user.id,
        context_id_param: contextId
      })

      if (error) throw error

      toast.success('Grado eliminado correctamente')
      await cargarContextoTrabajo()
      return true
    } catch (error: any) {
      console.error('Error deactivating context:', error)
      toast.error('Error al eliminar grado: ' + error.message)
      return false
    }
  }

  return {
    contexto,
    availableContexts,
    hasContexto,
    loading,
    actualizarContexto,
    switchContext,
    deactivateContext
  }
}

