"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from './use-auth'

export interface ProyectoData {
  nombre: string
  problematica: string
  producto_final: string
  metodologia_nem: string
  grupo_id: string
  pdas_seleccionados: string[]
}

export interface ProyectoGuardado {
  id: string
  nombre: string
  problematica: string
  producto_final: string
  metodologia_nem: string
  grupo_id: string
  estado: string
  created_at: string
}

export function useProyectos() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener el usuario actual directamente
  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('❌ Error obteniendo usuario:', error)
        return null
      }
      return user
    } catch (err) {
      console.error('❌ Error en getCurrentUser:', err)
      return null
    }
  }

  const crearProyecto = async (data: ProyectoData): Promise<{ proyecto: ProyectoGuardado; proyecto_id: string } | null> => {
    const user = await getCurrentUser()
    if (!user) {
      setError('Usuario no autenticado')
      return null
    }

    setLoading(true)
    setError(null)

    try {

      // Llamar a la nueva API que maneja todo el proceso (con cookies automáticas)
      const response = await fetch('/api/proyectos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error del servidor: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al crear el proyecto')
      }


      // Obtener el proyecto completo para devolverlo
      const proyectoCompleto = await obtenerProyecto(result.proyecto_id)
      
      if (!proyectoCompleto) {
        throw new Error('Error obteniendo datos del proyecto creado')
      }

      return {
        proyecto: proyectoCompleto,
        proyecto_id: result.proyecto_id
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error creando proyecto:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const obtenerProyectos = async (): Promise<ProyectoGuardado[]> => {
    const user = await getCurrentUser()
    
    if (!user) {
      setError('Usuario no autenticado')
      return []
    }
    

    setLoading(true)
    setError(null)

    try {
      
      // Usar el cliente de Supabase normal (con cookies automáticas)
      const { data, error } = await supabase
        .from('proyectos')
        .select(`
          id,
          nombre,
          problematica,
          producto_final,
          metodologia_nem,
          grupo_id,
          estado,
          created_at,
          grupos!inner(nombre, grado, nivel),
          proyecto_curriculo(
            curriculo_sep(
              campo_formativo,
              pda,
              contenido
            )
          ),
          proyecto_fases(
            id,
            fase_nombre,
            momento_nombre,
            contenido,
            orden
          )
        `)
        .eq('profesor_id', user.id)
        .order('created_at', { ascending: false })


      if (error) {
        console.error('❌ Error en consulta:', error)
        throw new Error(`Error obteniendo proyectos: ${error.message}`)
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error obteniendo proyectos:', err)
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  const obtenerProyecto = async (proyectoId: string): Promise<ProyectoGuardado | null> => {
    const user = await getCurrentUser()
    
    if (!user) {
      setError('Usuario no autenticado')
      return null
    }
    

    setLoading(true)
    setError(null)

    try {
      
      // Usar el cliente de Supabase normal (con cookies automáticas)
      const { data, error } = await supabase
        .from('proyectos')
        .select(`
          id,
          nombre,
          problematica,
          producto_final,
          metodologia_nem,
          grupo_id,
          estado,
          created_at,
          grupos!inner(nombre, grado, nivel)
        `)
        .eq('id', proyectoId)
        .eq('profesor_id', user.id)
        .single()


      if (error) {
        console.error('❌ Error en consulta proyecto:', error)
        throw new Error(`Error obteniendo proyecto: ${error.message}`)
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error obteniendo proyecto:', err)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const obtenerFasesProyecto = async (proyectoId: string): Promise<any[]> => {
    const user = await getCurrentUser()
    
    if (!user) {
      setError('Usuario no autenticado')
      return []
    }

    try {
      // Usar el cliente de Supabase normal (con cookies automáticas)
      const { data, error } = await supabase
        .from('proyecto_fases')
        .select(`
          id,
          fase_nombre,
          momento_nombre,
          contenido,
          orden
        `)
        .eq('proyecto_id', proyectoId)
        .order('orden', { ascending: true })

      if (error) {
        throw new Error(`Error obteniendo fases: ${error.message}`)
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error obteniendo fases:', err)
      return []
    }
  }

  const eliminarProyecto = async (proyectoId: string): Promise<boolean> => {
    const user = await getCurrentUser()
    
    if (!user) {
      setError('Usuario no autenticado')
      return false
    }

    setLoading(true)
    setError(null)

    try {

      // Obtener el token de sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        throw new Error('No se pudo obtener el token de sesión')
      }

      const response = await fetch(`/api/proyectos/delete?id=${proyectoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error eliminando el proyecto')
      }

      const result = await response.json()
      return true

    } catch (err) {
      console.error('❌ Error eliminando proyecto:', err)
      setError(err instanceof Error ? err.message : 'Error eliminando el proyecto')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    crearProyecto,
    obtenerProyectos,
    obtenerProyecto,
    obtenerFasesProyecto,
    eliminarProyecto,
    loading,
    error
  }
}
