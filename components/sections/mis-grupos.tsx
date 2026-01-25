'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getGruposByOwner, deleteGrupo, type Grupo } from '@/lib/grupos'
import { Loader2, Users as UsersIcon, Calendar, Plus, Edit, Trash2, Eye, Users, CheckSquare, BookOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { format } from 'date-fns'
import NuevoGrupo from './nuevo-grupo'
import ViewGrupo from './view-grupo'
import EditGrupo from './edit-grupo'
import GestionarAlumnos from './gestionar-alumnos'
import TomarAsistenciaGrupo from './tomar-asistencia-grupo'

interface MisGruposProps {
  onNavigateToMensajesPadres?: (studentData: any) => void;
  onNavigateToMensajesPadresAlumno?: (studentData: any) => void;
  initialGrupoId?: string | null;
  initialViewMode?: "list" | "view" | "edit" | "new" | "gestionar-alumnos" | "tomar-asistencia" | "evaluaciones";
}

const MisGrupos = ({
  onNavigateToMensajesPadres,
  onNavigateToMensajesPadresAlumno,
  initialGrupoId = null,
  initialViewMode = "list"
}: MisGruposProps = {}) => {
  const { user } = useAuth()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(initialViewMode === 'list')
  const [error, setError] = useState<string | null>(null)
  const [showNuevoGrupo, setShowNuevoGrupo] = useState(false)
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(initialGrupoId)
  const [viewMode, setViewMode] = useState<"list" | "view" | "edit" | "new" | "gestionar-alumnos" | "tomar-asistencia" | "evaluaciones">(initialViewMode)
  const [deletingGrupoId, setDeletingGrupoId] = useState<string | null>(null)


  const handleTomarAsistencia = (grupoId: string) => {
    setSelectedGrupoId(grupoId)
    setViewMode('tomar-asistencia')
  }

  const handleEvaluaciones = (grupoId: string) => {
    setSelectedGrupoId(grupoId)
    setViewMode('evaluaciones')
  }

  // Usar useMemo para evitar que la fecha cambie en cada render
  const fechaHoy = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const fetchGrupos = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const gruposData = await getGruposByOwner(user.id)
      setGrupos(gruposData)
    } catch (err) {
      console.error("Error fetching grupos:", err)
      setError("No se pudieron cargar los grupos.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (viewMode === "list" && !showNuevoGrupo) {
      fetchGrupos()
    }
  }, [viewMode, showNuevoGrupo, fetchGrupos])



  const handleViewGrupo = (grupoId: string) => {
    setSelectedGrupoId(grupoId)
    setViewMode("view")
  }

  const handleEditGrupo = (grupoId: string) => {
    setSelectedGrupoId(grupoId)
    setViewMode("edit")
  }

  const handleGestionarAlumnos = (grupoId: string) => {
    setSelectedGrupoId(grupoId)
    setViewMode("gestionar-alumnos")
  }

  const handleDeleteGrupo = async (grupoId: string) => {
    setDeletingGrupoId(grupoId)
    try {
      await deleteGrupo(grupoId)
      setGrupos(grupos.filter(grupo => grupo.id !== grupoId))
    } catch (err) {
      console.error("Error deleting grupo:", err)
      setError("No se pudo eliminar el grupo.")
    } finally {
      setDeletingGrupoId(null)
    }
  }

  const handleBackToList = () => {
    setSelectedGrupoId(null)
    setViewMode("list")
    setShowNuevoGrupo(false)
  }

  const handleNuevoGrupoSuccess = () => {
    setShowNuevoGrupo(false)
    setViewMode("list")
    fetchGrupos()
  }

  const handleEditGrupoSuccess = () => {
    setViewMode("list")
    fetchGrupos()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando grupos...</span>
      </div>
    )
  }

  if (showNuevoGrupo) {
    return (
      <NuevoGrupo
        onBack={handleBackToList}
        onSaveSuccess={handleNuevoGrupoSuccess}
      />
    )
  }

  if ((viewMode === "view" || viewMode === "evaluaciones") && selectedGrupoId) {
    return (
      <ViewGrupo
        grupoId={selectedGrupoId}
        onBack={handleBackToList}
        onEdit={() => handleEditGrupo(selectedGrupoId)}
        initialViewMode={viewMode === 'evaluaciones' ? 'evaluaciones' : 'details'}
      />
    )
  }

  if (viewMode === "edit" && selectedGrupoId) {
    return (
      <EditGrupo
        grupoId={selectedGrupoId}
        onBack={handleBackToList}
        onSaveSuccess={handleEditGrupoSuccess}
      />
    )
  }

  if (viewMode === "gestionar-alumnos" && selectedGrupoId) {
    return (
      <GestionarAlumnos
        grupoId={selectedGrupoId}
        onBack={handleBackToList}
        onNavigateToMensajesPadres={onNavigateToMensajesPadres}
        onNavigateToMensajesPadresAlumno={onNavigateToMensajesPadresAlumno}
      />
    )
  }

  if (viewMode === "tomar-asistencia" && selectedGrupoId) {
    return (
      <TomarAsistenciaGrupo
        grupoId={selectedGrupoId}
        fecha={fechaHoy}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mis Grupos</h1>
          <p className="text-gray-600 mt-2">Gestiona tus grupos de estudiantes</p>
        </div>
        <Button onClick={() => setShowNuevoGrupo(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Grupo
        </Button>
      </div>

      {grupos.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tienes grupos aún</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primer grupo de estudiantes</p>
            <Button onClick={() => setShowNuevoGrupo(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {grupos.map((grupo) => (
            <Card
              key={grupo.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewGrupo(grupo.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {grupo.nombre}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">
                        {grupo.ciclo_escolar}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="text-base px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700 font-semibold shadow-sm">
                      {grupo.grado} {grupo.nivel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">

                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-800 w-full sm:w-auto">
                    <div className="bg-white dark:bg-gray-700 p-1.5 rounded-full shadow-sm">
                      <UsersIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">
                        {grupo.numero_alumnos || 0}
                      </span>
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        Alumnos
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      className="col-span-2 sm:w-auto bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                      onClick={() => handleTomarAsistencia(grupo.id)}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Tomar asistencia
                    </Button>
                    <Button
                      size="sm"
                      className="col-span-2 sm:w-auto bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                      onClick={() => handleEvaluaciones(grupo.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Evaluaciones
                    </Button>
                    <Button
                      size="sm"
                      className="col-span-2 sm:w-auto bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-sm"
                      onClick={() => handleViewGrupo(grupo.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      className="col-span-2 sm:w-auto bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm"
                      onClick={() => handleGestionarAlumnos(grupo.id)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Alumnos
                    </Button>
                    <Button
                      size="sm"
                      className="col-span-2 sm:w-auto bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 shadow-sm"
                      onClick={() => handleEditGrupo(grupo.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          className="text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 shadow-sm"
                          disabled={deletingGrupoId === grupo.id}
                        >
                          {deletingGrupoId === grupo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el grupo "{grupo.nombre}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGrupo(grupo.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisGrupos