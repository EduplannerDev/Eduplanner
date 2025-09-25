"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Users, 
  FileText, 
  FolderOpen, 
  BookOpen, 
  Activity, 
  TrendingUp,
  UserCheck,
  Clock,
  Star,
  Award,
  Target
} from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { 
  getPlatformPulse, 
  type DirectorDashboardStats, 
  type TeacherActivity, 
  type PlatformPulse 
} from "@/lib/director-stats"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DirectorDashboardProps {
  onSectionChange?: (section: string) => void
}

export function DirectorDashboard({ onSectionChange }: DirectorDashboardProps) {
  const { plantel, loading: rolesLoading } = useRoles()
  const [platformData, setPlatformData] = useState<PlatformPulse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!rolesLoading && plantel?.id) {
      loadDashboardData()
    }
  }, [plantel?.id, rolesLoading])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!plantel?.id) {
        throw new Error('No se encontró información del plantel')
      }

      console.log('🔍 DIRECTOR DASHBOARD: Cargando datos para plantel:', plantel.id)
      console.log('🔍 DIRECTOR DASHBOARD: Plantel info:', plantel)
      
      const data = await getPlatformPulse(plantel.id)
      console.log('🔍 DIRECTOR DASHBOARD: Datos recibidos:', data)
      
      setPlatformData(data)
    } catch (err) {
      console.error('❌ DIRECTOR DASHBOARD: Error cargando datos del dashboard:', err)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (rolesLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard del director...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error al cargar datos</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="text-primary hover:underline"
          >
            Intentar de nuevo
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!platformData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  const { stats, teacherActivity, periodInfo } = platformData
  const activationRate = stats.totalProfesores > 0 ? (stats.licenciasActivas / stats.totalProfesores) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard del Director</h1>
          <p className="text-muted-foreground mt-1">
            Pulso de la plataforma • {plantel?.nombre}
          </p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="mb-2">
            <Target className="h-3 w-3 mr-1" />
            Director
          </Badge>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Widget: Pulso de la Plataforma */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Pulso de la Plataforma</CardTitle>
          </div>
          <CardDescription>
            Adopción y actividad general • {periodInfo.mesActual}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPIs Principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Profesores Activos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profesores Activos</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.licenciasActivas} / {stats.totalProfesores}
                </div>
                <p className="text-xs text-muted-foreground">
                  licencias activas esta semana
                </p>
                <div className="mt-2">
                  <Progress value={activationRate} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {activationRate.toFixed(1)}% de adopción
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Planeaciones Creadas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planeaciones Creadas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.planeacionesCreadas}</div>
                <p className="text-xs text-muted-foreground">
                  planeaciones en {periodInfo.mesActual}
                </p>
              </CardContent>
            </Card>

            {/* Proyectos Iniciados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Iniciados</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.proyectosIniciados}</div>
                <p className="text-xs text-muted-foreground">
                  proyectos nuevos
                </p>
              </CardContent>
            </Card>

            {/* Recursos Compartidos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recursos Compartidos</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recursosCompartidos}</div>
                <p className="text-xs text-muted-foreground">
                  en biblioteca escolar
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Lista de Actividad Docente */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Actividad Docente</h3>
              <Badge variant="outline" className="ml-auto">
                Última semana
              </Badge>
            </div>
            
            {teacherActivity.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No hay actividad docente registrada esta semana
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {teacherActivity.slice(0, 8).map((teacher, index) => {
                  const totalActivity = teacher.planeaciones + teacher.proyectos + teacher.notasSeguimiento + teacher.plantillasCompartidas
                  const isTopPerformer = index < 3 && totalActivity > 0
                  
                  return (
                    <Card key={teacher.id} className={isTopPerformer ? "border-primary/30 bg-primary/5" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                              isTopPerformer ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              {teacher.nombre.charAt(0)}{teacher.apellido.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  Prof. {teacher.nombre} {teacher.apellido}
                                </p>
                                {isTopPerformer && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Top
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {teacher.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-4 text-sm">
                              {teacher.planeaciones > 0 && (
                                <div className="text-center">
                                  <div className="font-medium">{teacher.planeaciones}</div>
                                  <div className="text-xs text-muted-foreground">planeaciones</div>
                                </div>
                              )}
                              {teacher.proyectos > 0 && (
                                <div className="text-center">
                                  <div className="font-medium">{teacher.proyectos}</div>
                                  <div className="text-xs text-muted-foreground">proyectos</div>
                                </div>
                              )}
                              {teacher.notasSeguimiento > 0 && (
                                <div className="text-center">
                                  <div className="font-medium">{teacher.notasSeguimiento}</div>
                                  <div className="text-xs text-muted-foreground">notas</div>
                                </div>
                              )}
                              {teacher.plantillasCompartidas > 0 && (
                                <div className="text-center">
                                  <div className="font-medium">{teacher.plantillasCompartidas}</div>
                                  <div className="text-xs text-muted-foreground">plantillas</div>
                                </div>
                              )}
                            </div>
                            
                            {totalActivity === 0 && (
                              <div className="text-sm text-muted-foreground">
                                Sin actividad esta semana
                              </div>
                            )}
                            
                            {teacher.ultimaActividad && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                Última: {format(new Date(teacher.ultimaActividad), "dd/MM", { locale: es })}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                {teacherActivity.length > 8 && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Y {teacherActivity.length - 8} profesores más...
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Insights y Recomendaciones */}
          <Separator />
          
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Insights</h4>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              {activationRate >= 80 && (
                <p>✅ Excelente adopción de la plataforma ({activationRate.toFixed(1)}%)</p>
              )}
              {activationRate < 50 && (
                <p>⚠️ Oportunidad de mejora en adopción ({activationRate.toFixed(1)}%)</p>
              )}
              {stats.recursosCompartidos > 10 && (
                <p>📚 Gran colaboración en la biblioteca escolar</p>
              )}
              {teacherActivity.filter(t => t.planeaciones + t.proyectos + t.notasSeguimiento > 5).length > 0 && (
                <p>⭐ Identificados profesores "power users" que pueden ayudar a otros</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}