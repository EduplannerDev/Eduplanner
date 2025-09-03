"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRoles } from '@/hooks/use-roles'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DebugUserRole() {
  const { user } = useAuth()
  const { role, plantel, isAdmin, isDirector, isProfesor, loading } = useRoles()
  const [profileData, setProfileData] = useState<any>(null)
  const [assignmentData, setAssignmentData] = useState<any[]>([])
  const [debugLoading, setDebugLoading] = useState(true)

  useEffect(() => {
    async function loadDebugData() {
      if (!user?.id) return

      try {
        // Obtener datos del perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else {
          setProfileData(profile)
        }

        // Obtener asignaciones de plantel
        const { data: assignments, error: assignmentError } = await supabase
          .from('user_plantel_assignments')
          .select(`
            *,
            plantel:planteles(*)
          `)
          .eq('user_id', user.id)

        if (assignmentError) {
          console.error('Error fetching assignments:', assignmentError)
        } else {
          setAssignmentData(assignments || [])
        }
      } catch (error) {
        console.error('Error in loadDebugData:', error)
      } finally {
        setDebugLoading(false)
      }
    }

    loadDebugData()
  }, [user?.id])

  if (!user) {
    return <div>No hay usuario autenticado</div>
  }

  if (loading || debugLoading) {
    return <div>Cargando información de debug...</div>
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug: Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Usuario ID:</strong> {user.id}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Rol efectivo:</strong> <Badge>{role || 'Sin rol'}</Badge>
          </div>
          <div>
            <strong>Es Admin:</strong> <Badge variant={isAdmin ? 'default' : 'secondary'}>{isAdmin ? 'Sí' : 'No'}</Badge>
          </div>
          <div>
            <strong>Es Director:</strong> <Badge variant={isDirector ? 'default' : 'secondary'}>{isDirector ? 'Sí' : 'No'}</Badge>
          </div>
          <div>
            <strong>Es Profesor:</strong> <Badge variant={isProfesor ? 'default' : 'secondary'}>{isProfesor ? 'Sí' : 'No'}</Badge>
          </div>
          <div>
            <strong>Plantel:</strong> {plantel?.nombre || 'Sin plantel'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Perfil (profiles)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignaciones de Plantel (user_plantel_assignments)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(assignmentData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}