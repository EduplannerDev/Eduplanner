"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRoles } from "@/hooks/use-roles"

interface PlantelStats {
  // Estadísticas de usuarios
  totalUsuarios: number
  totalProfesores: number
  totalDirectores: number
  totalAdministradores: number
  
  // Estadísticas de planeaciones
  totalPlaneaciones: number
  planeacionesEsteMes: number
  planeacionesPorMateria: { materia: string; count: number }[]
  
  // Estadísticas de exámenes
  totalExamenes: number
  examenesEsteMes: number
  examenesPorMateria: { materia: string; count: number }[]
  
  // Estadísticas de grupos
  totalGrupos: number
  totalAlumnos: number
  
  // Estadísticas de actividad
  eventosEsteMes: number
  mensajesEsteMes: number
}

interface UsePlantelStatsReturn {
  stats: PlantelStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePlantelStats(): UsePlantelStatsReturn {
  const [stats, setStats] = useState<PlantelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { plantel, isDirector } = useRoles()

  const fetchStats = async () => {
    if (!plantel?.id || !isDirector) {
      setStats(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Obtener estadísticas de usuarios usando la función RPC
      const { data: userStats, error: userStatsError } = await supabase
        .rpc('get_plantel_user_count', { plantel_id: plantel.id })

      if (userStatsError) {
        console.error('Error fetching user stats:', userStatsError)
        throw userStatsError
      }

      const userCounts = userStats?.[0] || {
        total_usuarios: 0,
        total_profesores: 0,
        total_directores: 0,
        total_administradores: 0
      }

      // 2. Obtener IDs de usuarios del plantel
      const userIds = await getUserIdsFromPlantel(plantel.id)
      const userIdsArray = userIds.split(',')

      // 3. Obtener estadísticas de planeaciones del plantel
      const { data: planeaciones, error: planeacionesError } = await supabase
        .from('planeaciones')
        .select('id, materia, created_at')
        .in('user_id', userIdsArray)
        .is('deleted_at', null)

      if (planeacionesError) {
        console.error('Error fetching planeaciones:', planeacionesError)
      }

      // 4. Obtener estadísticas de exámenes del plantel
      const { data: examenes, error: examenesError } = await supabase
        .from('examenes')
        .select('id, subject, created_at')
        .in('owner_id', userIdsArray)

      if (examenesError) {
        console.error('Error fetching examenes:', examenesError)
      }

      // 5. Obtener estadísticas de grupos del plantel
      const { data: grupos, error: gruposError } = await supabase
        .from('grupos')
        .select('id, alumnos')
        .in('user_id', userIdsArray)

      if (gruposError) {
        console.error('Error fetching grupos:', gruposError)
      }

      // 6. Obtener estadísticas de eventos del mes
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const { data: eventos, error: eventosError } = await supabase
        .from('events')
        .select('id, created_at')
        .in('user_id', userIdsArray)
        .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
        .lt('created_at', new Date(currentYear, currentMonth + 1, 1).toISOString())

      if (eventosError) {
        console.error('Error fetching eventos:', eventosError)
      }

      // 7. Obtener estadísticas de mensajes del mes
      const { data: mensajes, error: mensajesError } = await supabase
        .from('mensajes')
        .select('id, created_at')
        .in('user_id', userIdsArray)
        .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
        .lt('created_at', new Date(currentYear, currentMonth + 1, 1).toISOString())

      if (mensajesError) {
        console.error('Error fetching mensajes:', mensajesError)
      }

      // Procesar datos
      const planeacionesData = planeaciones || []
      const examenesData = examenes || []
      const gruposData = grupos || []
      const eventosData = eventos || []
      const mensajesData = mensajes || []

      // Calcular estadísticas de planeaciones
      const planeacionesEsteMes = planeacionesData.filter(p => {
        const createdDate = new Date(p.created_at)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).length

      const planeacionesPorMateria = planeacionesData.reduce((acc, p) => {
        const materia = p.materia || 'Sin materia'
        const existing = acc.find(item => item.materia === materia)
        if (existing) {
          existing.count++
        } else {
          acc.push({ materia, count: 1 })
        }
        return acc
      }, [] as { materia: string; count: number }[])
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Calcular estadísticas de exámenes
      const examenesEsteMes = examenesData.filter(e => {
        const createdDate = new Date(e.created_at)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).length

      const examenesPorMateria = examenesData.reduce((acc, e) => {
        const materia = e.subject || 'Sin materia'
        const existing = acc.find(item => item.materia === materia)
        if (existing) {
          existing.count++
        } else {
          acc.push({ materia, count: 1 })
        }
        return acc
      }, [] as { materia: string; count: number }[])
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Calcular estadísticas de grupos y alumnos
      const totalAlumnos = gruposData.reduce((total, grupo) => {
        const alumnos = grupo.alumnos || []
        return total + alumnos.length
      }, 0)

      const compiledStats: PlantelStats = {
        // Usuarios
        totalUsuarios: userCounts.total_usuarios,
        totalProfesores: userCounts.total_profesores,
        totalDirectores: userCounts.total_directores,
        totalAdministradores: userCounts.total_administradores,
        
        // Planeaciones
        totalPlaneaciones: planeacionesData.length,
        planeacionesEsteMes,
        planeacionesPorMateria,
        
        // Exámenes
        totalExamenes: examenesData.length,
        examenesEsteMes,
        examenesPorMateria,
        
        // Grupos
        totalGrupos: gruposData.length,
        totalAlumnos,
        
        // Actividad
        eventosEsteMes: eventosData.length,
        mensajesEsteMes: mensajesData.length
      }

      setStats(compiledStats)
    } catch (err) {
      console.error('Error fetching plantel stats:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Función auxiliar para obtener IDs de usuarios del plantel
  const getUserIdsFromPlantel = async (plantelId: string): Promise<string> => {
    try {
      // Obtener usuarios del plantel desde profiles
      const { data: profileUsers, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('plantel_id', plantelId)
        .eq('activo', true)

      // Obtener usuarios del plantel desde user_plantel_assignments
      const { data: assignmentUsers, error: assignmentError } = await supabase
        .from('user_plantel_assignments')
        .select('user_id')
        .eq('plantel_id', plantelId)
        .eq('activo', true)

      const profileIds = profileUsers?.map(u => u.id) || []
      const assignmentIds = assignmentUsers?.map(u => u.user_id) || []
      
      // Combinar y eliminar duplicados
      const allIds = [...new Set([...profileIds, ...assignmentIds])]
      
      return allIds.length > 0 ? allIds.join(',') : '00000000-0000-0000-0000-000000000000'
    } catch (error) {
      console.error('Error getting user IDs:', error)
      return '00000000-0000-0000-0000-000000000000'
    }
  }

  useEffect(() => {
    fetchStats()
  }, [plantel?.id, isDirector])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}