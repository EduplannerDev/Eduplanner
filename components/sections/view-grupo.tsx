'use client'

import { useState, useEffect } from 'react'
import { getGrupoById, type Grupo } from '@/lib/grupos'
import { ArrowLeft, Edit, Users, Calendar, GraduationCap, FileText, Loader2, ClipboardList, X, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getHistorialAsistenciaGrupo, AsistenciaHistorial, getAlumnosConAsistencia, AsistenciaConAlumno } from '@/lib/asistencia'
import GestionarAlumnos from './gestionar-alumnos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ViewGrupoProps {
  grupoId: string
  onBack: () => void
  onEdit: () => void
}

type ViewMode = 'details' | 'alumnos' | 'asistencias'

const ViewGrupo = ({ grupoId, onBack, onEdit }: ViewGrupoProps) => {
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('details')
  const [historialAsistencia, setHistorialAsistencia] = useState<AsistenciaHistorial[]>([])
  const [loadingAsistencia, setLoadingAsistencia] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [detalleAsistencia, setDetalleAsistencia] = useState<AsistenciaConAlumno[]>([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('')
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const handleGestionarAlumnos = () => {
    setViewMode('alumnos')
  }

  const handleVerAsistencias = async () => {
    setViewMode('asistencias')
    setLoadingAsistencia(true)
    try {
      const historial = await getHistorialAsistenciaGrupo(grupoId)
      setHistorialAsistencia(historial)
    } catch (error) {
      console.error('Error loading attendance history:', error)
    } finally {
      setLoadingAsistencia(false)
    }
  }

  const handleVerDetalleAsistencia = async (fecha: string) => {
    setFechaSeleccionada(fecha)
    setShowDetalleModal(true)
    setLoadingDetalle(true)
    try {
      const detalle = await getAlumnosConAsistencia(grupoId, fecha)
      setDetalleAsistencia(detalle)
    } catch (error) {
      console.error('Error loading attendance detail:', error)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const handleBackToDetails = () => {
    setViewMode('details')
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'presente':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'ausente':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'retardo':
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case 'justificado':
        return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      default:
        return null
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'presente':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'ausente':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'retardo':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'justificado':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  useEffect(() => {
    const fetchGrupo = async () => {
      setLoading(true)
      setError(null)
      try {
        const grupoData = await getGrupoById(grupoId)
        if (!grupoData) {
          setError('Grupo no encontrado')
          return
        }
        setGrupo(grupoData)
      } catch (err) {
        console.error('Error fetching grupo:', err)
        setError('Error al cargar el grupo')
      } finally {
        setLoading(false)
      }
    }

    fetchGrupo()
  }, [grupoId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando grupo...</span>
      </div>
    )
  }

  if (error || !grupo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error || 'Grupo no encontrado'}
        </div>
      </div>
    )
  }

  // Renderizar gestión de alumnos si está en ese modo
  if (viewMode === 'alumnos') {
    return (
      <GestionarAlumnos 
        grupoId={grupoId} 
        onBack={handleBackToDetails} 
      />
    )
  }

  // Renderizar vista de asistencias si está en ese modo
  if (viewMode === 'asistencias') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToDetails}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Detalles
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Historial de Asistencias</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Registro de Asistencias - {grupo.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAsistencia ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando historial...</span>
              </div>
            ) : historialAsistencia.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No hay registros de asistencia para este grupo</p>
              </div>
            ) : (
               <div className="space-y-4">
                 {historialAsistencia.map((registro, index) => (
                   <div 
                     key={`${registro.fecha}-${index}`} 
                     className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                     onClick={() => handleVerDetalleAsistencia(registro.fecha)}
                   >
                     <div className="flex justify-between items-start mb-2">
                       <div>
                         <h3 className="font-semibold">
                           {format(new Date(registro.fecha), 'EEEE, d MMMM yyyy', { locale: es })}
                         </h3>
                         <p className="text-sm text-gray-600">
                           Total de alumnos: {registro.total_alumnos} • Haz clic para ver detalle
                         </p>
                       </div>
                       <Badge 
                         variant={registro.porcentaje_asistencia >= 80 ? "default" : "destructive"}
                       >
                         {registro.porcentaje_asistencia}% asistencia
                       </Badge>
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                       <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                         <div className="text-lg font-bold text-green-600 dark:text-green-400">
                           {registro.presentes}
                         </div>
                         <div className="text-sm text-gray-600 dark:text-gray-300">Presentes</div>
                       </div>
                       <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                         <div className="text-lg font-bold text-red-600 dark:text-red-400">
                           {registro.ausentes}
                         </div>
                         <div className="text-sm text-gray-600 dark:text-gray-300">Ausentes</div>
                       </div>
                       <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                         <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                           {registro.retardos}
                         </div>
                         <div className="text-sm text-gray-600 dark:text-gray-300">Retardos</div>
                       </div>
                       <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                         <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                           {registro.justificados}
                         </div>
                         <div className="text-sm text-gray-600 dark:text-gray-300">Justificados</div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalle de Asistencia */}
        <Dialog open={showDetalleModal} onOpenChange={setShowDetalleModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Detalle de Asistencia - {fechaSeleccionada && format(new Date(fechaSeleccionada), 'EEEE, d MMMM yyyy', { locale: es })}
              </DialogTitle>
            </DialogHeader>
            
            {loadingDetalle ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando detalle...</span>
              </div>
            ) : detalleAsistencia.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No hay registros de asistencia para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {detalleAsistencia.filter(a => a.estado === 'presente').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Presentes</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {detalleAsistencia.filter(a => a.estado === 'ausente').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Ausentes</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {detalleAsistencia.filter(a => a.estado === 'retardo').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Retardos</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {detalleAsistencia.filter(a => a.estado === 'justificado').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Justificados</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg mb-4">Lista de Alumnos</h3>
                  {detalleAsistencia
                    .sort((a, b) => {
                      if (a.alumno_numero_lista && b.alumno_numero_lista) {
                        return a.alumno_numero_lista - b.alumno_numero_lista
                      }
                      return a.alumno_nombre.localeCompare(b.alumno_nombre)
                    })
                    .map((alumno, index) => (
                      <div key={alumno.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium">
                            {alumno.alumno_numero_lista || index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{alumno.alumno_nombre}</p>
                            {alumno.notas && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">Nota: {alumno.notas}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getEstadoColor(alumno.estado)}`}>
                            {getEstadoIcon(alumno.estado)}
                            <span className="capitalize">{alumno.estado}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(alumno.hora_registro), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{grupo.nombre}</h1>
            <p className="text-gray-600 mt-2">{grupo.grado} de {grupo.nivel}</p>
          </div>
        </div>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Grupo
        </Button>
      </div>

      <div className="space-y-6">
        {/* Información Principal */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información del Grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre del Grupo</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{grupo.nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nivel Educativo</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{grupo.nivel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Grado</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{grupo.grado}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ciclo Escolar</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{grupo.ciclo_escolar}</p>
                </div>
              </div>
              

            </CardContent>
          </Card>

          {/* Tarjeta destacada de Ver Asistencias */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <ClipboardList className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Historial de Asistencias</h3>
                    <p className="text-blue-100 text-sm">
                      Revisa el registro completo de asistencias de {grupo.nombre} • {grupo.numero_alumnos || 0} alumnos
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleVerAsistencias}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 h-auto"
                >
                  <ClipboardList className="h-5 w-5 mr-2" />
                  Ver Historial
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas del Grupo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {grupo.numero_alumnos || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Alumnos
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    0
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Planeaciones
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    0
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Exámenes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ViewGrupo