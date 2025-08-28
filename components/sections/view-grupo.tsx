'use client'

import { useState, useEffect } from 'react'
import { getGrupoById, type Grupo } from '@/lib/grupos'
import { ArrowLeft, Edit, Users, Calendar, GraduationCap, FileText, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import GestionarAlumnos from './gestionar-alumnos'

interface ViewGrupoProps {
  grupoId: string
  onBack: () => void
  onEdit: () => void
}

type ViewMode = 'details' | 'alumnos'

const ViewGrupo = ({ grupoId, onBack, onEdit }: ViewGrupoProps) => {
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('details')

  const handleGestionarAlumnos = () => {
    setViewMode('alumnos')
  }

  const handleBackToDetails = () => {
    setViewMode('details')
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="md:col-span-2 space-y-6">
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
              
              {grupo.descripcion && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{grupo.descripcion}</p>
                  </div>
                </>
              )}
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
                    {grupo.numero_alumnos}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {grupo.numero_alumnos === 1 ? 'Alumno' : 'Alumnos'}
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

        {/* Panel Lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Creación</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(grupo.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Actualización</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(grupo.updated_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-center">
                  {grupo.nivel}
                </Badge>
                <Badge variant="secondary" className="w-full justify-center">
                  {grupo.ciclo_escolar}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Ver Planeaciones
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <GraduationCap className="h-4 w-4 mr-2" />
                Ver Exámenes
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGestionarAlumnos}>
                <Users className="h-4 w-4 mr-2" />
                Alumnos
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Próximamente disponible
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ViewGrupo