"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  BarChart3
} from "lucide-react"
import { usePlantelStats } from "@/hooks/use-plantel-stats"
import { useRoles } from "@/hooks/use-roles"

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
}

function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`} />
            <span className={`text-xs ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value} {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TopItemsCardProps {
  title: string
  items: { materia: string; count: number }[]
  icon: React.ReactNode
  emptyMessage: string
}

function TopItemsCard({ title, items, icon, emptyMessage }: TopItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.materia} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <span className="text-sm font-medium">{item.materia}</span>
                </div>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function PlantelEstadisticas() {
  const { plantel, isDirector } = useRoles()
  const { stats, loading, error, refetch } = usePlantelStats()

  if (!isDirector || !plantel) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Solo los directores pueden acceder a las estadísticas del plantel.
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar las estadísticas: {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={refetch}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!stats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se pudieron cargar las estadísticas del plantel.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con información del plantel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estadísticas del Plantel</h2>
          <p className="text-muted-foreground">
            Métricas y reportes de actividad de {plantel.nombre}
          </p>
        </div>
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Usuarios"
          value={stats.totalUsuarios}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="Usuarios activos en el plantel"
        />
        
        <StatCard
          title="Profesores"
          value={stats.totalProfesores}
          icon={<GraduationCap className="h-4 w-4 text-blue-500" />}
          description="Profesores asignados"
        />
        
        <StatCard
          title="Planeaciones"
          value={stats.totalPlaneaciones}
          icon={<BookOpen className="h-4 w-4 text-green-500" />}
          description="Total de planeaciones creadas"
          trend={{
            value: stats.planeacionesEsteMes,
            label: "este mes",
            isPositive: stats.planeacionesEsteMes > 0
          }}
        />
        
        <StatCard
          title="Exámenes"
          value={stats.totalExamenes}
          icon={<FileText className="h-4 w-4 text-purple-500" />}
          description="Total de exámenes creados"
          trend={{
            value: stats.examenesEsteMes,
            label: "este mes",
            isPositive: stats.examenesEsteMes > 0
          }}
        />
      </div>

      {/* Segunda fila de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Grupos"
          value={stats.totalGrupos}
          icon={<Users className="h-4 w-4 text-orange-500" />}
          description="Grupos activos"
        />
        
        <StatCard
          title="Alumnos"
          value={stats.totalAlumnos}
          icon={<GraduationCap className="h-4 w-4 text-cyan-500" />}
          description="Total de alumnos registrados"
        />
        
        <StatCard
          title="Eventos"
          value={stats.eventosEsteMes}
          icon={<Calendar className="h-4 w-4 text-indigo-500" />}
          description="Eventos este mes"
        />
        
        <StatCard
          title="Mensajes"
          value={stats.mensajesEsteMes}
          icon={<MessageSquare className="h-4 w-4 text-pink-500" />}
          description="Mensajes este mes"
        />
      </div>

      {/* Gráficos y rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopItemsCard
          title="Top Materias - Planeaciones"
          items={stats.planeacionesPorMateria}
          icon={<BookOpen className="h-5 w-5 text-green-500" />}
          emptyMessage="No hay planeaciones registradas"
        />
        
        <TopItemsCard
          title="Top Materias - Exámenes"
          items={stats.examenesPorMateria}
          icon={<FileText className="h-5 w-5 text-purple-500" />}
          emptyMessage="No hay exámenes registrados"
        />
      </div>

      {/* Resumen de actividad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumen de Actividad
          </CardTitle>
          <CardDescription>
            Actividad general del plantel en el mes actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.planeacionesEsteMes}
              </div>
              <div className="text-sm text-muted-foreground">
                Planeaciones creadas
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.examenesEsteMes}
              </div>
              <div className="text-sm text-muted-foreground">
                Exámenes generados
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.eventosEsteMes + stats.mensajesEsteMes}
              </div>
              <div className="text-sm text-muted-foreground">
                Interacciones totales
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}