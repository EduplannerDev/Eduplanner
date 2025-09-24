"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  UserCheck
} from 'lucide-react'
import { 
  getPlatformStats, 
  getRecentActivity, 
  getUsuariosSinPlantel,
  type PlatformStats,
  type RecentActivity,
  type UsuariosSinPlantel
} from '@/lib/admin-stats'

export function AdminDashboard() {
  const { isAdmin, isDirector, plantel, role, loading } = useRoles()
  const [activeTab, setActiveTab] = useState('overview')
  
  // Estados para las estadísticas
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [usuariosSinPlantel, setUsuariosSinPlantel] = useState<UsuariosSinPlantel | null>(null)
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
      const [stats, activity, usuariosSinPlantelData] = await Promise.all([
        getPlatformStats(),
        getRecentActivity(),
        getUsuariosSinPlantel()
      ])
      
      setPlatformStats(stats)
      setRecentActivity(activity)
      setUsuariosSinPlantel(usuariosSinPlantelData)
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="planteles" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Planteles
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


      </Tabs>
    </div>
  )
}