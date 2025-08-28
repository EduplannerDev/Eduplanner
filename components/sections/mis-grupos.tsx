'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getGruposByOwner, deleteGrupo, type Grupo } from '@/lib/grupos'
import { Loader2, Users as UsersIcon, Calendar, Plus, Edit, Trash2, Eye, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import NuevoGrupo from './nuevo-grupo'
import ViewGrupo from './view-grupo'
import EditGrupo from './edit-grupo'
import GestionarAlumnos from './gestionar-alumnos'

interface MisGruposProps {
  onNavigateToMensajesPadres?: (studentData: any) => void;
  onNavigateToMensajesPadresAlumno?: (studentData: any) => void;
}

const MisGrupos = ({ onNavigateToMensajesPadres, onNavigateToMensajesPadresAlumno }: MisGruposProps = {}) => {
  const { user } = useAuth()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNuevoGrupo, setShowNuevoGrupo] = useState(false)
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "view" | "edit" | "new" | "gestionar-alumnos">("list")
  const [deletingGrupoId, setDeletingGrupoId] = useState<string | null>(null)

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

  if (viewMode === "view" && selectedGrupoId) {
    return (
      <ViewGrupo
        grupoId={selectedGrupoId}
        onBack={handleBackToList}
        onEdit={() => handleEditGrupo(selectedGrupoId)}
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
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg dark:text-gray-100">{grupo.nombre}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2 dark:text-gray-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(grupo.created_at).toLocaleDateString("es-MX")}
                      </span>
                      <span>{grupo.grado} de {grupo.nivel}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="dark:text-gray-100 dark:border-gray-700">
                      {grupo.ciclo_escolar}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {grupo.numero_alumnos} {grupo.numero_alumnos === 1 ? 'alumno' : 'alumnos'}
                    </span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewGrupo(grupo.id)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleGestionarAlumnos(grupo.id)}
                    >
                      <Users className="h-4 w-4" />
                      Alumnos
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditGrupo(grupo.id)}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          disabled={deletingGrupoId === grupo.id}
                        >
                          {deletingGrupoId === grupo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
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