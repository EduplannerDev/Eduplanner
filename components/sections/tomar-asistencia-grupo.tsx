"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Users,
  Calendar,
  Save,
  UserCheck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  getAlumnosConAsistencia, 
  guardarAsistenciaAlumno, 
  marcarTodosPresentes,
  type AsistenciaConAlumno, 
  type EstadoAsistencia 
} from "@/lib/asistencia"
import { getGrupoById, type Grupo } from "@/lib/grupos"

interface TomarAsistenciaGrupoProps {
  grupoId: string
  fecha: string
  onBack: () => void
}

const estadosAsistencia = [
  { 
    value: 'presente' as EstadoAsistencia, 
    label: 'Presente', 
    color: 'bg-green-500 hover:bg-green-600 text-white',
    icon: CheckCircle 
  },
  { 
    value: 'ausente' as EstadoAsistencia, 
    label: 'Ausente', 
    color: 'bg-red-500 hover:bg-red-600 text-white',
    icon: XCircle 
  },
  { 
    value: 'retardo' as EstadoAsistencia, 
    label: 'Retardo', 
    color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    icon: Clock 
  },
  { 
    value: 'justificado' as EstadoAsistencia, 
    label: 'Justificado', 
    color: 'bg-blue-500 hover:bg-blue-600 text-white',
    icon: FileText 
  }
]

export default function TomarAsistenciaGrupo({ grupoId, fecha, onBack }: TomarAsistenciaGrupoProps) {
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [alumnos, setAlumnos] = useState<AsistenciaConAlumno[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notasAbiertas, setNotasAbiertas] = useState<string | null>(null)
  const [notasTemp, setNotasTemp] = useState<{ [key: string]: string }>({})
  const [cambiosPendientes, setCambiosPendientes] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [grupoId, fecha])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [grupoData, alumnosData] = await Promise.all([
        getGrupoById(grupoId),
        getAlumnosConAsistencia(grupoId, fecha)
      ])
      
      setGrupo(grupoData)
      setAlumnos(alumnosData)
      
      // Inicializar notas temporales
      const notasIniciales: { [key: string]: string } = {}
      alumnosData.forEach(alumno => {
        if (alumno.notas) {
          notasIniciales[alumno.alumno_id] = alumno.notas
        }
      })
      setNotasTemp(notasIniciales)
      
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarTodosPresentes = () => {
    // Solo actualizar estado local, no guardar automáticamente
    setAlumnos(prev => prev.map(alumno => ({
      ...alumno,
      estado: 'presente' as EstadoAsistencia
    })))
    setCambiosPendientes(true)
  }

  const handleCambiarEstado = (alumnoId: string, nuevoEstado: EstadoAsistencia) => {
    // Solo actualizar estado local, no guardar automáticamente
    setAlumnos(prev => prev.map(alumno => 
      alumno.alumno_id === alumnoId 
        ? { ...alumno, estado: nuevoEstado }
        : alumno
    ))
    setCambiosPendientes(true)
  }

  const handleGuardarAsistencia = async () => {
    try {
      setSaving(true)
      
      // Guardar asistencia para todos los alumnos que tienen un estado definido
      const promesas = alumnos
        .filter(alumno => alumno.estado) // Solo alumnos con estado definido
        .map(alumno => {
          const notas = notasTemp[alumno.alumno_id] || alumno.notas
          return guardarAsistenciaAlumno(
            alumno.alumno_id, 
            grupoId, 
            fecha, 
            alumno.estado, 
            notas
          )
        })
      
      await Promise.all(promesas)
      
      // Actualizar notas en el estado local
      setAlumnos(prev => prev.map(alumno => ({
        ...alumno,
        notas: notasTemp[alumno.alumno_id] || alumno.notas
      })))
      
      // Limpiar notas temporales y marcar como guardado
      setNotasTemp({})
      setNotasAbiertas(null)
      setCambiosPendientes(false)
      
      toast({
        title: "Éxito",
        description: "Asistencia guardada correctamente para todos los alumnos",
      })
      
      // Regresar al listado principal después de guardar
      setTimeout(() => {
        onBack()
      }, 1500) // Esperar 1.5 segundos para que el usuario vea el mensaje de éxito
    } catch (err) {
      console.error('Error saving attendance:', err)
      toast({
        title: "Error",
        description: "No se pudo guardar la asistencia",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getEstadisticas = () => {
    const total = alumnos.length
    const presentes = alumnos.filter(a => a.estado === 'presente').length
    const ausentes = alumnos.filter(a => a.estado === 'ausente').length
    const retardos = alumnos.filter(a => a.estado === 'retardo').length
    const justificados = alumnos.filter(a => a.estado === 'justificado').length
    
    return { total, presentes, ausentes, retardos, justificados }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
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
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = getEstadisticas()

  return (
    <div className="space-y-6">
      {/* Alerta de cambios pendientes */}
      {cambiosPendientes && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            ⚠️ Tienes cambios sin guardar. Presiona "Guardar Asistencia" para guardar todos los cambios.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            Asistencia - {grupo?.nombre}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(fecha), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} • 
            {grupo?.grado} {grupo?.nivel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleMarcarTodosPresentes}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Marcar Todos Presentes'}
          </Button>
          
          <Button
            onClick={handleGuardarAsistencia}
            disabled={saving || !cambiosPendientes}
            className={`flex items-center gap-2 text-white ${
              cambiosPendientes 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : cambiosPendientes ? 'Guardar Asistencia' : 'Sin Cambios'}
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.presentes}</div>
            <div className="text-sm text-green-600">Presentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.ausentes}</div>
            <div className="text-sm text-red-600">Ausentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.retardos}</div>
            <div className="text-sm text-yellow-600">Retardos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.justificados}</div>
            <div className="text-sm text-blue-600">Justificados</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alumnos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Alumnos ({alumnos.length})
          </CardTitle>
          <CardDescription>
            Selecciona el estado de asistencia para cada alumno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alumnos.map((alumno) => {
              const estadoActual = estadosAsistencia.find(e => e.value === alumno.estado)
              const IconoEstado = estadoActual?.icon || CheckCircle
              
              return (
                <div key={alumno.alumno_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {alumno.alumno_numero_lista && (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {alumno.alumno_numero_lista}
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{alumno.alumno_nombre}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <IconoEstado className="h-4 w-4" />
                          <Badge variant="outline" className={estadoActual?.color}>
                            {estadoActual?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Botones de estado */}
                      <div className="flex gap-1">
                        {estadosAsistencia.map((estado) => {
                          const Icono = estado.icon
                          const isActive = alumno.estado === estado.value
                          
                          return (
                            <Button
                              key={estado.value}
                              size="sm"
                              variant={isActive ? "default" : "outline"}
                              className={isActive ? estado.color : ""}
                              onClick={() => handleCambiarEstado(alumno.alumno_id, estado.value)}
                            >
                              <Icono className="h-4 w-4 mr-1" />
                              {estado.label}
                            </Button>
                          )
                        })}
                      </div>
                      
                      {/* Botón de notas */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (notasAbiertas === alumno.alumno_id) {
                            setNotasAbiertas(null)
                          } else {
                            setNotasAbiertas(alumno.alumno_id)
                            if (!notasTemp[alumno.alumno_id]) {
                              setNotasTemp(prev => ({
                                ...prev,
                                [alumno.alumno_id]: alumno.notas || ''
                              }))
                            }
                          }
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Campo de notas */}
                  {notasAbiertas === alumno.alumno_id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Agregar notas sobre la asistencia..."
                          value={notasTemp[alumno.alumno_id] || ''}
                          onChange={(e) => {
                            setNotasTemp(prev => ({
                              ...prev,
                              [alumno.alumno_id]: e.target.value
                            }))
                            setCambiosPendientes(true)
                          }}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNotasAbiertas(null)
                              // Restaurar notas originales si se cancela
                              setNotasTemp(prev => {
                                const newTemp = { ...prev }
                                newTemp[alumno.alumno_id] = alumno.notas || ''
                                return newTemp
                              })
                            }}
                          >
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {alumnos.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay alumnos registrados
              </h3>
              <p className="text-gray-600">
                Este grupo no tiene alumnos registrados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}