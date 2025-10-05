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
    const startTime = Date.now()
    console.log('🚀 [FRONTEND] Iniciando creación de proyecto desde frontend')
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('❌ [FRONTEND] Usuario no autenticado')
      setError('Usuario no autenticado')
      return null
    }

    console.log('✅ [FRONTEND] Usuario autenticado:', user.id)
    setLoading(true)
    setError(null)

    try {
      // Obtener el token de sesión
      console.log('🔑 [FRONTEND] Obteniendo token de sesión')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        throw new Error('No se pudo obtener el token de sesión')
      }

      console.log('✅ [FRONTEND] Token de sesión obtenido')

      // Llamar a la nueva API que maneja todo el proceso (con Bearer token)
      console.log('📡 [FRONTEND] Enviando request a API de creación')
      const apiStartTime = Date.now()
      
      const response = await fetch('/api/proyectos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data)
      })

      const apiTime = Date.now() - apiStartTime
      console.log(`⏱️ [FRONTEND] Tiempo de respuesta de API: ${apiTime}ms`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [FRONTEND] Error en respuesta de API:', errorData)
        throw new Error(errorData.error || `Error del servidor: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ [FRONTEND] Respuesta de API recibida:', { success: result.success, proyecto_id: result.proyecto_id })

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al crear el proyecto')
      }

      // Obtener el proyecto completo para devolverlo
      console.log('📋 [FRONTEND] Obteniendo proyecto completo')
      const proyectoCompleto = await obtenerProyecto(result.proyecto_id)
      
      if (!proyectoCompleto) {
        throw new Error('Error obteniendo datos del proyecto creado')
      }

      const totalTime = Date.now() - startTime
      console.log(`🎉 [FRONTEND] Proyecto creado exitosamente en ${totalTime}ms`)

      return {
        proyecto: proyectoCompleto,
        proyecto_id: result.proyecto_id
      }

    } catch (err) {
      const totalTime = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ [FRONTEND] Error creando proyecto:', err)
      console.error(`⏱️ [FRONTEND] Tiempo total antes del error: ${totalTime}ms`)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const obtenerProyectos = async (): Promise<ProyectoGuardado[]> => {
    const user = await getCurrentUser()
    
    if (!user) {
      console.error('❌ [PROYECTOS] Usuario no autenticado')
      setError('Usuario no autenticado')
      return []
    }

    console.log('🔍 [PROYECTOS] Obteniendo proyectos para usuario:', user.id)
    
    // Verificar el perfil del usuario para debuggear RLS
    console.log('🔍 [PROYECTOS] Verificando perfil del usuario...')
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, activo, plantel_id, subscription_plan')
      .eq('id', user.id)
      .single()
    
    console.log('📊 [PROYECTOS] Perfil del usuario:', { 
      profile: userProfile, 
      error: profileError?.message || null 
    })
    
    setLoading(true)
    setError(null)

    try {
      
      // Primero, hacer una consulta simple sin JOINs para ver si hay proyectos
      console.log('🔍 [PROYECTOS] Consulta simple sin JOINs...')
      const { data: simpleData, error: simpleError } = await supabase
        .from('proyectos')
        .select('id, nombre, profesor_id, created_at')
        .eq('profesor_id', user.id)
        .order('created_at', { ascending: false })
      
      console.log('📊 [PROYECTOS] Consulta simple resultado:', { 
        dataCount: simpleData?.length || 0, 
        error: simpleError?.message || null,
        data: simpleData
      })
      
      // También verificar todos los proyectos en la base de datos para comparar
      console.log('🔍 [PROYECTOS] Verificando todos los proyectos en la base de datos...')
      const { data: allProjects, error: allError } = await supabase
        .from('proyectos')
        .select('id, nombre, profesor_id, created_at')
        .order('created_at', { ascending: false })
      
      console.log('📊 [PROYECTOS] Todos los proyectos en BD:', { 
        dataCount: allProjects?.length || 0, 
        error: allError?.message || null,
        data: allProjects?.map(p => ({ id: p.id, nombre: p.nombre, profesor_id: p.profesor_id }))
      })
      
      // Usar el cliente de Supabase normal (con cookies automáticas)
      console.log('📡 [PROYECTOS] Ejecutando consulta completa con JOINs...')
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

      console.log('📊 [PROYECTOS] Resultado de consulta:', { 
        dataCount: data?.length || 0, 
        error: error?.message || null 
      })

      if (error) {
        console.error('❌ [PROYECTOS] Error en consulta:', error)
        throw new Error(`Error obteniendo proyectos: ${error.message}`)
      }

      if (data && data.length > 0) {
        console.log('✅ [PROYECTOS] Proyectos encontrados:', data.map(p => ({ id: p.id, nombre: p.nombre })))
      } else {
        console.log('⚠️ [PROYECTOS] No se encontraron proyectos para este usuario')
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
