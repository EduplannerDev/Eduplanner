"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ClipboardCheck, 
  Users, 
  Calendar,
  ArrowLeft,
  Clock
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getGruposByOwner, type Grupo } from "@/lib/grupos"
import { verificarAsistenciaExiste } from "@/lib/asistencia"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import TomarAsistenciaGrupo from "./tomar-asistencia-grupo"

interface TomarAsistenciaProps {
  onBack: () => void
}

export default function TomarAsistencia({ onBack }: TomarAsistenciaProps) {
  const { user } = useAuth()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null)
  const [gruposConEstado, setGruposConEstado] = useState<(Grupo & { asistenciaTomada: boolean })[]>([])
  
  // Usar useMemo para evitar que today cambie en cada render
  const today = useMemo(() => new Date(), [])
  const fechaHoy = useMemo(() => format(today, 'yyyy-MM-dd'), [today])

  const loadGrupos = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const gruposData = await getGruposByOwner(user.id)
      const gruposActivos = gruposData.filter(grupo => grupo.activo)
      setGrupos(gruposActivos)
      
      // Verificar estado de asistencia para cada grupo
      const gruposConEstadoData = await Promise.all(
        gruposActivos.map(async (grupo) => {
          const asistenciaTomada = await verificarAsistenciaExiste(grupo.id, fechaHoy)
          return { ...grupo, asistenciaTomada }
        })
      )
      setGruposConEstado(gruposConEstadoData)
    } catch (err) {
      console.error('Error loading grupos:', err)
      setError('No se pudieron cargar los grupos')
    } finally {
      setLoading(false)
    }
  }, [user?.id, fechaHoy])

  useEffect(() => {
    loadGrupos()
  }, [loadGrupos])

  const handleTomarAsistenciaGrupo = (grupo: Grupo) => {
    setSelectedGrupo(grupo)
  }

  const handleBackToList = () => {
    setSelectedGrupo(null)
    // Recargar los grupos para actualizar los estados
    loadGrupos()
  }

  // Si hay un grupo seleccionado, mostrar el componente de asistencia del grupo
  if (selectedGrupo) {
    return (
      <TomarAsistenciaGrupo 
        grupoId={selectedGrupo.id}
        fecha={fechaHoy}
        onBack={handleBackToList}
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tomar Asistencia</h1>
            <p className="text-muted-foreground mt-2">Cargando grupos...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tomar Asistencia</h1>
            <p className="text-muted-foreground mt-2">Error al cargar los datos</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={loadGrupos}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Tomar Asistencia Hoy</h1>
          <p className="text-muted-foreground mt-2">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{format(today, "HH:mm")}</span>
        </div>
      </div>

      {/* Información del día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumen del Día
          </CardTitle>
          <CardDescription>
            Selecciona un grupo para tomar asistencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{grupos.length}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Grupos Totales</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{gruposConEstado.filter(g => g.asistenciaTomada).length}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Asistencias Tomadas</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{gruposConEstado.filter(g => !g.asistenciaTomada).length}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Pendientes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de grupos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mis Grupos
          </CardTitle>
          <CardDescription>
            Haz clic en un grupo para tomar asistencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grupos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hay grupos disponibles</h3>
              <p className="text-sm">Crea tu primer grupo para comenzar a tomar asistencia</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gruposConEstado.map((grupo, index) => (
                <div key={grupo.id}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{grupo.nombre}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{grupo.nivel} - {grupo.grado}</span>
                            <span>•</span>
                            <span>Ciclo {grupo.ciclo_escolar}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {grupo.asistenciaTomada ? (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          Completado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                          Pendiente
                        </Badge>
                      )}
                      <Button 
                        onClick={() => handleTomarAsistenciaGrupo(grupo)}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        {grupo.asistenciaTomada ? 'Ver Asistencia' : 'Tomar Asistencia'}
                      </Button>
                    </div>
                  </div>
                  {index < gruposConEstado.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}