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
  CheckCircle2,
  AlertCircle,
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
  const [estadisticasCiclo, setEstadisticasCiclo] = useState({
    totalPDAs: 0,
    completados: 0,
    enProgreso: 0,
    pendientes: 0,
    porcentajeCompletado: 0
  })
  const [cargandoEstadisticasCiclo, setCargandoEstadisticasCiclo] = useState(false)

  const displayName = user?.user_metadata?.full_name || userData?.full_name || "Profesor"
  const firstName = displayName.split(' ')[0]

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
      cargarEstadisticasCicloEscolar()
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

  // Función para cargar estadísticas del ciclo escolar (copiada del módulo de dosificación)
  const cargarEstadisticasCicloEscolar = async () => {
    if (!user?.id) return

    try {
      setCargandoEstadisticasCiclo(true)

      // Obtener el contexto de trabajo del usuario usando RPC (igual que en dosificación)
      const { data, error: errorContexto } = await supabase
        .rpc('get_contexto_trabajo_activo', { profesor_id_param: user.id })

      if (errorContexto) {
        console.error('Error cargando contexto de trabajo:', errorContexto)
        setCargandoEstadisticasCiclo(false)
        return
      }

      if (!data || data.length === 0) {
        setCargandoEstadisticasCiclo(false)
        return
      }

      const contexto = data[0] // Tomar el primer elemento del array (igual que en dosificación)

      // Obtener todos los contenidos dosificados para el contexto actual (igual que en dosificación)
      const { data: contenidosDosificados, error: errorDosificados } = await supabase
        .from('dosificacion_meses')
        .select(`
          contenido_id,
          mes,
          curriculo_sep!inner(
            id,
            pda,
            grado,
            campo_formativo
          )
        `)
        .eq('profesor_id', user.id)
        .eq('contexto_id', contexto.id)
        .eq('seleccionado', true)

      if (errorDosificados) {
        console.error('Error cargando contenidos dosificados:', errorDosificados)
        setCargandoEstadisticasCiclo(false)
        return
      }

      // Obtener planeaciones que tienen contenidos relacionados (igual que en dosificación)
      const { data: planeaciones, error: errorPlaneaciones } = await supabase
        .from('planeaciones')
        .select(`
          id,
          contenidos_relacionados,
          estado,
          origen
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (errorPlaneaciones) {
        console.error('Error cargando planeaciones:', errorPlaneaciones)
        setCargandoEstadisticasCiclo(false)
        return
      }

      // Calcular estadísticas (igual que en dosificación)
      const totalPDAs = contenidosDosificados?.length || 0
      let completados = 0
      let enProgreso = 0
      let pendientes = 0

      // Crear un mapa de contenidos con planeación
      const contenidosConPlaneacion = new Set()
      
      planeaciones?.forEach(planeacion => {
        if (planeacion.contenidos_relacionados && Array.isArray(planeacion.contenidos_relacionados)) {
          planeacion.contenidos_relacionados.forEach(contenidoId => {
            contenidosConPlaneacion.add(contenidoId)
          })
        }
      })

      // Clasificar cada contenido dosificado
      contenidosDosificados?.forEach(contenido => {
        if (contenidosConPlaneacion.has(contenido.contenido_id)) {
          // Tiene planeación = Completado
          completados++
        } else {
          // No tiene planeación pero tiene mes asignado = En Progreso
          enProgreso++
        }
      })

      // Los pendientes son los contenidos del currículo que NO están dosificados
      const { data: totalContenidosGrado, error: errorTotal } = await supabase
        .from('curriculo_sep')
        .select('id')
        .eq('grado', contexto.grado)

      if (errorTotal) {
        console.error('Error cargando total de contenidos:', errorTotal)
        pendientes = 0
      } else {
        const totalContenidos = totalContenidosGrado?.length || 0
        pendientes = totalContenidos - totalPDAs
      }

      const porcentajeCompletado = totalPDAs > 0 ? Math.round((completados / totalPDAs) * 100) : 0

      setEstadisticasCiclo({
        totalPDAs,
        completados,
        enProgreso,
        pendientes,
        porcentajeCompletado
      })

    } catch (error) {
      console.error('Error cargando estadísticas del ciclo escolar:', error)
    } finally {
      setCargandoEstadisticasCiclo(false)
    }
  }

  // Componente para gráfico circular de progreso
  const GraficoCircularProgreso = ({ porcentaje, size = 120 }: { porcentaje: number, size?: number }) => {
    const radio = (size - 8) / 2
    const circunferencia = 2 * Math.PI * radio
    const strokeDasharray = circunferencia
    const strokeDashoffset = circunferencia - (porcentaje / 100) * circunferencia

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Círculo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Círculo de progreso */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-blue-600 transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Porcentaje en el centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {porcentaje}%
          </span>
        </div>
      </div>
    )
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
      case 'planeacion': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'examen': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'mensaje': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
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
    <div className="space-y-4 md:space-y-6">
      {/* Saludo personalizado */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          ¡Hola, {firstName}! 👋
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Bienvenido a tu panel de control. Aquí tienes un resumen de tu actividad educativa.
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Planeaciones</CardTitle>
            <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">{stats.planeaciones}</div>
            <p className="text-xs text-muted-foreground">Total creadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Exámenes</CardTitle>
            <GraduationCap className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">{stats.examenes}</div>
            <p className="text-xs text-muted-foreground">Total generados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Grupos</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">{stats.grupos}</div>
            <p className="text-xs text-muted-foreground">Grupos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Mensajes</CardTitle>
            <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">{stats.mensajes}</div>
            <p className="text-xs text-muted-foreground">Mensajes enviados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tarjeta destacada de Tomar Asistencia */}
      <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 text-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-white/20 rounded-full">
                <ClipboardCheck className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">Tomar Asistencia Hoy</h3>
                <p className="text-emerald-100 text-xs md:text-sm">
                   Registra la asistencia de tus {stats.grupos} grupos • {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                 </p>
              </div>
            </div>
            <Button 
              onClick={() => onSectionChange('tomar-asistencia')}
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-4 md:px-6 py-2 md:py-3 h-auto w-full md:w-auto"
            >
              <ClipboardCheck className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Comenzar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Acciones rápidas */}
        <Card>
          <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-lg md:text-xl">Acciones Rápidas</CardTitle>
            <CardDescription className="text-sm">
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-3 md:p-4 flex flex-col items-center gap-2 ${action.color} text-white border-0`}
                  onClick={action.action}
                >
                  <div className="h-4 w-4 md:h-5 md:w-5">
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-xs md:text-sm">{action.title}</div>
                    <div className="text-xs opacity-90 hidden sm:block">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card>
          <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-lg md:text-xl">Actividad Reciente</CardTitle>
            <CardDescription className="text-sm">
              Tus últimas creaciones y modificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
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

        {/* Resumen General del Ciclo Escolar */}
        <Card>
          <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Resumen del Ciclo Escolar
            </CardTitle>
            <CardDescription className="text-sm">
              Progreso general de tu dosificación curricular
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            {cargandoEstadisticasCiclo ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (estadisticasCiclo.totalPDAs === 0 && !cargandoEstadisticasCiclo) ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No hay dosificación configurada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Ve al módulo de dosificación para comenzar
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => onSectionChange('dosificacion')}
                >
                  Ir a Dosificación
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Gráfico circular de progreso */}
                <div className="flex justify-center">
                  <GraficoCircularProgreso 
                    porcentaje={estadisticasCiclo.porcentajeCompletado} 
                    size={100}
                  />
                </div>

                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-3 gap-2">
                  {/* PDAs Completados */}
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                      Completados
                    </p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {estadisticasCiclo.completados}
                    </p>
                  </div>

                  {/* PDAs en Progreso */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                      En Progreso
                    </p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {estadisticasCiclo.enProgreso}
                    </p>
                  </div>

                  {/* PDAs Pendientes */}
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">
                      Pendientes
                    </p>
                    <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                      {estadisticasCiclo.pendientes}
                    </p>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {estadisticasCiclo.totalPDAs} dosificados de {estadisticasCiclo.totalPDAs + estadisticasCiclo.pendientes} total
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progreso del mes */}
      <Card>
        <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
          <CardTitle className="text-lg md:text-xl">Progreso del Mes</CardTitle>
          <CardDescription className="text-sm">
            {isPro ? "Tu productividad en el mes actual (Plan PRO)" : "Tu productividad en el mes actual (Plan Free)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
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