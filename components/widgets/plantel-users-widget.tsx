"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, Crown, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface PlantelUserStats {
  profesores_actuales: number
  directores_actuales: number
  max_profesores: number
  max_directores: number
  profesores_disponibles: number
  directores_disponibles: number
}

interface PlantelUsersWidgetProps {
  plantelId: string
  className?: string
}

export function PlantelUsersWidget({ plantelId, className }: PlantelUsersWidgetProps) {
  const [stats, setStats] = useState<PlantelUserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    if (!plantelId) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('planteles_with_limits')
        .select(`
          profesores_actuales,
          directores_actuales,
          max_profesores,
          max_directores,
          profesores_disponibles,
          directores_disponibles
        `)
        .eq('id', plantelId)
        .single()

      if (error) throw error

      setStats(data)
    } catch (err) {
      console.error('Error loading plantel stats:', err)
      setError('Error al cargar las estadísticas del plantel')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [plantelId])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios Asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando estadísticas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios Asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {error || 'No se pudieron cargar las estadísticas'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuarios Asignados
        </CardTitle>
        <CardDescription>
          Capacidad actual y espacios disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-center">
          {/* Profesores */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Profesores</span>
            </div>
            <p className="text-lg font-bold">
              {stats.profesores_actuales} / {stats.max_profesores}
            </p>
            <p className="text-xs text-muted-foreground">
              Asignados: {stats.profesores_actuales}
            </p>
            <p className="text-xs text-muted-foreground">
              Disponibles: {stats.profesores_disponibles}
            </p>
          </div>

          {/* Directores */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Directores</span>
            </div>
            <p className="text-lg font-bold">
              {stats.directores_actuales} / {stats.max_directores}
            </p>
            <p className="text-xs text-muted-foreground">
              Asignados: {stats.directores_actuales}
            </p>
            <p className="text-xs text-muted-foreground">
              Disponibles: {stats.directores_disponibles}
            </p>
          </div>

          {/* Total Usuarios */}
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">
              {stats.profesores_actuales + stats.directores_actuales}
            </p>
            <p className="text-sm text-muted-foreground">Total Usuarios</p>
          </div>

          {/* Espacios Disponibles */}
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">
              {stats.profesores_disponibles + stats.directores_disponibles}
            </p>
            <p className="text-sm text-muted-foreground">Espacios Disponibles</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}