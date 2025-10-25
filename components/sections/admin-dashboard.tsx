"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdministracionPlanteles } from './administracion-planteles'
import { useRoles } from '@/hooks/use-roles'
import { 
  Building2, 
  Shield, 
  BarChart3, 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  DollarSign,
  Activity,
  UserCheck,
  Settings,
  Monitor,
  Briefcase
} from 'lucide-react'
import { 
  getPlatformStats, 
  getRecentActivity, 
  getUsuariosSinPlantel,
  getContextoTrabajoData,
  getFeedbackData,
  type PlatformStats,
  type RecentActivity,
  type UsuariosSinPlantel,
  type ContextoTrabajoData,
  type FeedbackData
} from '@/lib/admin-stats'
import { LoggingMetricsWidget } from '@/components/admin/logging-widgets'

export function AdminDashboard() {
  const { isAdmin, isDirector, plantel, role, loading } = useRoles()
  const [activeTab, setActiveTab] = useState('overview')
  
  // Estados para las estadísticas
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [usuariosSinPlantel, setUsuariosSinPlantel] = useState<UsuariosSinPlantel | null>(null)
  const [contextoTrabajo, setContextoTrabajo] = useState<ContextoTrabajoData[]>([])
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  
  // Cargar estadísticas cuando el componente se monta
  useEffect(() => {
    if (isAdmin) {
      loadDashboardStats()
    }
  }, [isAdmin])

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true)
      const [stats, activity, usuariosSinPlantelData, contextoTrabajoData, feedbackDataResponse] = await Promise.all([
        getPlatformStats(),
        getRecentActivity(),
        getUsuariosSinPlantel(),
        getContextoTrabajoData(),
        getFeedbackData()
      ])
      
      setPlatformStats(stats)
      setRecentActivity(activity)
      setUsuariosSinPlantel(usuariosSinPlantelData)
      setContextoTrabajo(contextoTrabajoData)
      setFeedbackData(feedbackDataResponse)
    } catch (error) {
      console.error('Error cargando estadísticas del dashboard:', error)
    } finally {
      setStatsLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin && !isDirector) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">
            Solo los administradores y directores tienen acceso al panel de administración.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Administración</h1>
          <p className="text-muted-foreground mt-1">
            Panel de control para administradores de la plataforma EduPlanner
          </p>
        </div>
        <div className="text-right">
          <Badge variant="destructive" className="mb-2">
            <Shield className="h-3 w-3 mr-1" />
            Administrador
          </Badge>
          <p className="text-sm text-muted-foreground">
            Acceso completo al sistema
          </p>
        </div>
      </div>

      {/* Tabs de navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="planteles" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Planteles
          </TabsTrigger>
          <TabsTrigger value="contexto" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Grados y Maestros
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Monitoreo
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Contenido de las tabs */}
        <TabsContent value="overview" className="space-y-6">
          {statsLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando estadísticas...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Estadísticas principales */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{platformStats?.totalUsuarios || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {platformStats?.totalProfesores || 0} profesores, {platformStats?.totalDirectores || 0} directores
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{platformStats?.totalAlumnos || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      En {platformStats?.totalGrupos || 0} grupos activos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contenido Creado</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(platformStats?.totalPlaneaciones || 0) + (platformStats?.totalExamenes || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      {platformStats?.totalPlaneaciones || 0} planeaciones, {platformStats?.totalExamenes || 0} exámenes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribución de usuarios - Información del modelo SaaS */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Usuarios en Planteles
                    </CardTitle>
                    <CardDescription>
                      Usuarios asignados a instituciones educativas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {platformStats?.usuariosConPlantel || 0}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Usuarios trabajando en {platformStats?.totalPlanteles || 0} planteles activos
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Profesores:</span>
                        <span className="font-medium">{platformStats?.totalProfesores || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Directores:</span>
                        <span className="font-medium">{platformStats?.totalDirectores || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Usuarios Independientes
                    </CardTitle>
                    <CardDescription>
                      Usuarios del SaaS sin asignación de plantel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {usuariosSinPlantel?.totalUsuariosSinPlantel || 0}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Usuarios utilizando la plataforma de forma independiente
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Profesores:</span>
                        <span className="font-medium">{usuariosSinPlantel?.profesoresSinPlantel || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Directores:</span>
                        <span className="font-medium">{usuariosSinPlantel?.directoresSinPlantel || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Nuevos (7 días):</span>
                        <span className="font-medium text-green-600">{usuariosSinPlantel?.usuariosRecientesSinPlantel || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actividad de contenido */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Planeaciones</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{platformStats?.totalPlaneaciones || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{recentActivity?.nuevasPlaneaciones || 0} esta semana
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Exámenes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{platformStats?.totalExamenes || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{recentActivity?.nuevosExamenes || 0} esta semana
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mensajes IA</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{platformStats?.totalMensajes || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Mensajes generados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mensajes Padres</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{platformStats?.totalMensajesPadres || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Comunicación familiar
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Actividad reciente */}
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Actividad Reciente (7 días)
                    </CardTitle>
                    <CardDescription>
                      Nuevos registros y contenido creado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Nuevos usuarios</span>
                        </div>
                        <Badge variant="secondary">{recentActivity?.nuevosUsuarios || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Nuevas planeaciones</span>
                        </div>
                        <Badge variant="secondary">{recentActivity?.nuevasPlaneaciones || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">Nuevos exámenes</span>
                        </div>
                        <Badge variant="secondary">{recentActivity?.nuevosExamenes || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">Nuevos grupos</span>
                        </div>
                        <Badge variant="secondary">{recentActivity?.nuevosGrupos || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>


              </div>




            </>
          )}
        </TabsContent>

        <TabsContent value="planteles">
          {isAdmin ? (
            <AdministracionPlanteles />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
                <p className="text-muted-foreground">
                  Solo los administradores pueden gestionar planteles.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contexto" className="space-y-6">
          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Contexto de Trabajo - Grados y Maestros
                </CardTitle>
                <CardDescription>
                  Registro de grados asignados a maestros por ciclo escolar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contextoTrabajo.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay registros de contexto de trabajo disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-sm">Profesor</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm">Grado</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm">Ciclo Escolar</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm">Estado</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm">Fecha Inicio</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm">Fecha Fin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contextoTrabajo.map((contexto) => (
                          <tr key={contexto.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="font-medium">{contexto.profesor_nombre}</div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {contexto.profesor_email}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="secondary">
                                {contexto.grado > 0 
                                  ? `${contexto.grado}°` 
                                  : contexto.grado === -1 
                                  ? '3° Preescolar' 
                                  : contexto.grado === -2 
                                  ? '2° Preescolar'
                                  : '1° Preescolar'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center text-sm">
                              {contexto.ciclo_escolar}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {contexto.es_activo ? (
                                <Badge variant="default" className="bg-green-500">
                                  Activo
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Inactivo</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-sm">
                              {new Date(contexto.fecha_inicio).toLocaleDateString('es-MX')}
                            </td>
                            <td className="py-3 px-4 text-center text-sm">
                              {contexto.fecha_fin 
                                ? new Date(contexto.fecha_fin).toLocaleDateString('es-MX')
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
                <p className="text-muted-foreground">
                  Solo los administradores pueden ver el contexto de trabajo.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Feedback del Sistema
                </CardTitle>
                <CardDescription>
                  Comentarios, sugerencias y reportes de los usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackData.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay registros de feedback disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-sm">Tipo</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Mensaje</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm">Fecha</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedbackData.map((feedback) => (
                          <tr key={feedback.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <Badge variant="secondary">{feedback.type}</Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {feedback.email || 'Sin email'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="max-w-md">
                                <p className="text-sm truncate" title={feedback.text}>
                                  {feedback.text}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-sm">
                              {new Date(feedback.created_at).toLocaleDateString('es-MX')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {feedback.image_url && (
                                <a 
                                  href={feedback.image_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700 text-sm"
                                >
                                  Ver imagen
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
                <p className="text-muted-foreground">
                  Solo los administradores pueden ver el feedback.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {isAdmin ? (
            <LoggingMetricsWidget />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
                <p className="text-muted-foreground">
                  Solo los administradores pueden acceder al monitoreo del sistema.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {isAdmin ? (
            <>
              {/* Modo Mantenimiento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración del Sistema
                  </CardTitle>
                  <CardDescription>
                    Controla el estado general de la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Configuración del Sistema</h3>
                    <p className="text-muted-foreground">
                      Las opciones de configuración del sistema estarán disponibles próximamente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
                <p className="text-muted-foreground">
                  Solo los administradores pueden acceder a la configuración del sistema.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}