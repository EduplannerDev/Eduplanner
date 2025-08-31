"use client"

import { useEffect, useState } from 'react'
import { useAuth } from './use-auth'
import { UserRole, Plantel } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import { getUserMainPlantel, isUserAdmin, isUserDirectorOfPlantel } from '@/lib/planteles'

interface UserRoleData {
  role: UserRole | null
  plantel: Plantel | null
  isAdmin: boolean
  isDirector: boolean
  isProfesor: boolean
  canManagePlanteles: boolean
  canManageUsers: boolean
  canManageGroups: boolean
  loading: boolean
}

export function useRoles() {
  const { user } = useAuth()
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: null,
    plantel: null,
    isAdmin: false,
    isDirector: false,
    isProfesor: false,
    canManagePlanteles: false,
    canManageUsers: false,
    canManageGroups: false,
    loading: true
  })

  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.id) {
        setRoleData({
          role: null,
          plantel: null,
          isAdmin: false,
          isDirector: false,
          isProfesor: false,
          canManagePlanteles: false,
          canManageUsers: false,
          canManageGroups: false,
          loading: false
        })
        return
      }

      try {
        // Obtener perfil del usuario con su plantel
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            role,
            plantel_id,
            plantel:planteles(*)
          `)
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user role:', error.message)
          setRoleData(prev => ({ ...prev, loading: false }))
          return
        }

        // Verificar si el usuario tiene asignaciones en user_plantel_assignments
        const { data: assignments, error: assignmentError } = await supabase
          .from('user_plantel_assignments')
          .select(`
            role,
            plantel_id,
            plantel:planteles(*)
          `)
          .eq('user_id', user.id)
          .eq('activo', true)
          .order('created_at', { ascending: false })
          .limit(1)

        if (assignmentError) {
          console.error('Error fetching user assignments:', assignmentError.message)
        }

        // Determinar el rol efectivo: priorizar user_plantel_assignments sobre profiles
        const effectiveRole = (assignments && assignments.length > 0) 
          ? assignments[0].role as UserRole 
          : profile?.role as UserRole
        
        const effectivePlantel = (assignments && assignments.length > 0)
          ? assignments[0].plantel as unknown as Plantel
          : profile?.plantel as unknown as Plantel
        
        const isAdmin = effectiveRole === 'administrador'
        const isDirector = effectiveRole === 'director'
        const isProfesor = effectiveRole === 'profesor'

        // Determinar permisos basados en el rol
        const canManagePlanteles = isAdmin
        const canManageUsers = isAdmin || isDirector
        const canManageGroups = isAdmin || isDirector || isProfesor

        setRoleData({
          role: effectiveRole,
          plantel: effectivePlantel,
          isAdmin,
          isDirector,
          isProfesor,
          canManagePlanteles,
          canManageUsers,
          canManageGroups,
          loading: false
        })
      } catch (error) {
        console.error('Exception in fetchUserRole:', (error as Error).message)
        setRoleData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchUserRole()
  }, [user?.id])

  // Función para verificar si el usuario puede gestionar un plantel específico
  const canManagePlantel = (plantelId: string): boolean => {
    if (roleData.isAdmin) return true
    if (roleData.isDirector && roleData.plantel?.id === plantelId) return true
    return false
  }

  // Función para verificar si el usuario puede ver un plantel específico
  const canViewPlantel = (plantelId: string): boolean => {
    if (roleData.isAdmin) return true
    if (roleData.plantel?.id === plantelId) return true
    return false
  }

  // Función para verificar si el usuario puede gestionar un grupo específico
  const canManageGroup = (groupUserId: string, groupPlantelId?: string): boolean => {
    if (roleData.isAdmin) return true
    if (roleData.isDirector && roleData.plantel?.id === groupPlantelId) return true
    if (roleData.isProfesor && user?.id === groupUserId) return true
    return false
  }

  // Función para verificar si el usuario puede ver un grupo específico
  const canViewGroup = (groupUserId: string, groupPlantelId?: string): boolean => {
    if (roleData.isAdmin) return true
    if (roleData.isDirector && roleData.plantel?.id === groupPlantelId) return true
    if (user?.id === groupUserId) return true
    return false
  }

  return {
    ...roleData,
    canManagePlantel,
    canViewPlantel,
    canManageGroup,
    canViewGroup,
    // Función para refrescar los datos del rol
    refresh: () => {
      if (user?.id) {
        setRoleData(prev => ({ ...prev, loading: true }))
        // El useEffect se ejecutará automáticamente
      }
    }
  }
}

// Hook específico para verificar permisos de administrador
export function useAdminCheck() {
  const { isAdmin, loading } = useRoles()
  return { isAdmin, loading }
}

// Hook específico para verificar permisos de director
export function useDirectorCheck(plantelId?: string) {
  const { isDirector, plantel, loading } = useRoles()
  const isDirectorOfPlantel = plantelId ? plantel?.id === plantelId : false
  return { 
    isDirector, 
    isDirectorOfPlantel, 
    plantel, 
    loading 
  }
}

// Hook para obtener el plantel del usuario actual
export function useUserPlantel() {
  const { plantel, loading } = useRoles()
  return { plantel, loading }
}