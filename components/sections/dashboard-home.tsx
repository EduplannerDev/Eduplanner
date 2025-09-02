"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  Users, 
  FileText, 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  GraduationCap,
  ClipboardCheck
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useUserData } from "@/hooks/use-user-data"
import { useProfile } from "@/hooks/use-profile"
import { supabase } from "@/lib/supabase"
import { getMonthlyPlaneacionesCount } from "@/lib/planeaciones"
import { isUserPro } from "@/lib/subscription-utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DashboardHomeProps {
  onSectionChange: (section: string) => void
}

interface Stats {
  planeaciones: number
  examenes: number
  grupos: number
  mensajes: number
}

interface RecentActivity {
  id: string
  type: 'planeacion' | 'examen' | 'mensaje'
  title: string
  date: string
  status?: string
}

export function DashboardHome({ onSectionChange }: DashboardHomeProps) {
  const { user } = useAuth()
  const { userData } = useUserData(user?.id)
  const { profile } = useProfile()
  const [stats, setStats] = useState<Stats>({ planeaciones: 0, examenes: 0, grupos: 0, mensajes: 0 })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [monthlyPlaneaciones, setMonthlyPlaneaciones] = useState(0)
  const [loading, setLoading] = useState(true)

  const displayName = user?.user_metadata?.full_name || userData?.full_name || "Profesor"
  const firstName = displayName.split(' ')[0]

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  // Determinar si el usuario es pro y los límites
  const isPro = profile ? isUserPro(profile) : false
  const planeacionesLimit = isPro ? -1 : 5 // -1 significa ilimitado
  const examenesLimit = isPro ? -1 : -1 // Los exámenes son ilimitados para todos por ahora

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar estadísticas
      const [planeacionesRes, examenesRes, gruposRes, mensajesRes, monthlyCount] = await Promise.all([
        supabase.from('planeacion_creations').select('id').eq('user_id', user?.id),
        supabase.from('examenes').select('id').eq('owner_id', user?.id),
        supabase.from('grupos').select('id').eq('user_id', user?.id),
        supabase.from('messages').select('id').eq('user_id', user?.id),
        getMonthlyPlaneacionesCount(user?.id || '')
      ])

      // Debug logs
      console.log('Dashboard stats debug:', {
        planeaciones: { data: planeacionesRes.data, error: planeacionesRes.error, count: planeacionesRes.data?.length },
        examenes: { data: examenesRes.data, error: examenesRes.error, count: examenesRes.data?.length },
        grupos: { data: gruposRes.data, error: gruposRes.error, count: gruposRes.data?.length },
        mensajes: { data: mensajesRes.data, error: mensajesRes.error, count: mensajesRes.data?.length }
      })

      setStats({
        planeaciones: planeacionesRes.data?.length || 0,
        examenes: examenesRes.data?.length || 0,
        grupos: gruposRes.data?.length || 0,
        mensajes: mensajesRes.data?.length || 0
      })
      
      setMonthlyPlaneaciones(monthlyCount)

      // Cargar actividad reciente
      const recentPlaneaciones = await supabase
        .from('planeaciones')
        .select('id, titulo, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3)

      const recentExamenes = await supabase
        .from('examenes')
        .select('id, titulo, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(2)

      const activities: RecentActivity[] = []
      
      recentPlaneaciones.data?.forEach(item => {
        activities.push({
          id: item.id,
          type: 'planeacion',
          title: item.titulo,
          date: new Date(item.created_at).toLocaleDateString('es-ES')
        })
      })

      recentExamenes.data?.forEach(item => {
        activities.push({
          id: item.id,
          type: 'examen',
          title: item.titulo,
          date: new Date(item.created_at).toLocaleDateString('es-ES')
        })
      })

      // Ordenar por fecha más reciente
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentActivity(activities.slice(0, 5))

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'planeacion': return <FileText className="h-4 w-4" />
      case 'examen': return <GraduationCap className="h-4 w-4" />
      case 'mensaje': return <MessageSquare className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'planeacion': return 'bg-blue-100 text-blue-800'
      case 'examen': return 'bg-green-100 text-green-800'
      case 'mensaje': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const quickActions = [
    {
      title: "Nueva Planeación",
      description: "Crear una planeación didáctica",
      icon: <Plus className="h-5 w-5" />,
      action: () => onSectionChange('nueva-planeacion'),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Generar Examen",
      description: "Crear un examen con IA",
      icon: <GraduationCap className="h-5 w-5" />,
      action: () => onSectionChange('generar-examenes'),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Mis Grupos",
      description: "Gestionar estudiantes",
      icon: <Users className="h-5 w-5" />,
      action: () => onSectionChange('grupos'),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Mi Agenda",
      description: "Ver calendario",
      icon: <Calendar className="h-5 w-5" />,
      action: () => onSectionChange('agenda'),
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Saludo personalizado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          ¡Hola, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bienvenido a tu panel de control. Aquí tienes un resumen de tu actividad educativa.
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planeaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planeaciones}</div>
            <p className="text-xs text-muted-foreground">Total creadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exámenes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.examenes}</div>
            <p className="text-xs text-muted-foreground">Total generados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.grupos}</div>
            <p className="text-xs text-muted-foreground">Grupos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mensajes}</div>
            <p className="text-xs text-muted-foreground">Mensajes enviados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tarjeta destacada de Tomar Asistencia */}
      <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <ClipboardCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Tomar Asistencia Hoy</h3>
                <p className="text-emerald-100 text-sm">
                   Registra la asistencia de tus {stats.grupos} grupos • {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                 </p>
              </div>
            </div>
            <Button 
              onClick={() => onSectionChange('tomar-asistencia')}
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-6 py-3 h-auto"
            >
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Comenzar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${action.color} text-white border-0`}
                  onClick={action.action}
                >
                  {action.icon}
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Tus últimas creaciones y modificaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay actividad reciente</p>
                <p className="text-xs">Comienza creando tu primera planeación</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progreso del mes */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso del Mes</CardTitle>
          <CardDescription>
            {isPro ? "Tu productividad en el mes actual (Plan PRO)" : "Tu productividad en el mes actual (Plan Free)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Planeaciones creadas este mes</span>
                <span>
                  {monthlyPlaneaciones}
                  {isPro ? " (Ilimitadas)" : `/5`}
                </span>
              </div>
              {isPro ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Planeaciones ilimitadas con Plan PRO</span>
                </div>
              ) : (
                <>
                  <Progress value={(monthlyPlaneaciones / 5) * 100} className="h-2" />
                  {monthlyPlaneaciones >= 5 && (
                    <div className="text-sm text-amber-600 mt-1">
                      ⚠️ Has alcanzado el límite mensual. Actualiza a PRO para planeaciones ilimitadas.
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Exámenes generados</span>
                <span>{stats.examenes} (Ilimitados)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Exámenes ilimitados para todos los usuarios</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}