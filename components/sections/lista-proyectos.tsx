"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen, Users, Calendar, Eye, Edit, Trash2, Download } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProyectos } from '@/hooks/use-proyectos'
import { useProyectoWizard } from '@/hooks/use-proyecto-wizard'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/hooks/use-auth'
import { isUserPro } from '@/lib/subscription-utils'
import { BetaFeatureWrapper, BetaAccessDenied } from '@/components/ui/beta-feature-wrapper'
import { ViewProyecto } from './view-proyecto'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function ListaProyectos() {
  const { obtenerProyectos, eliminarProyecto, loading, error } = useProyectos()
  const router = useRouter()
  const { toast } = useToast()
  const { profile } = useProfile()
  const { user } = useAuth()
  const [proyectos, setProyectos] = useState<any[]>([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [selectedProyecto, setSelectedProyecto] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "view">("list")

  useEffect(() => {
    if (initialLoad) {
      cargarProyectos()
      setInitialLoad(false)
    }
  }, [initialLoad])

  const cargarProyectos = async () => {
    try {
      const proyectosData = await obtenerProyectos()
      setProyectos(proyectosData)
    } catch (error) {
      console.error('Error cargando proyectos:', error)
    }
  }

  const handleCrearNuevo = () => {
    // Navegar al módulo de crear proyecto
    router.push('/?section=crear-proyecto')
  }

  const handleVerProyecto = (proyectoId: string) => {
    setSelectedProyecto(proyectoId)
    setViewMode("view")
  }

  const handleBack = () => {
    setSelectedProyecto(null)
    setViewMode("list")
  }


  const handleEliminarProyecto = async (proyectoId: string, nombre: string) => {
    try {
      const success = await eliminarProyecto(proyectoId)
      
      if (success) {
        // Actualizar la lista de proyectos
        await cargarProyectos()
        
        toast({
          title: "Proyecto eliminado",
          description: `El proyecto "${nombre}" ha sido eliminado exitosamente.`,
          variant: "default"
        })
      } else {
        toast({
          title: "Error al eliminar",
          description: "No se pudo eliminar el proyecto. Inténtalo de nuevo.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error eliminando proyecto:', error)
      toast({
        title: "Error al eliminar",
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (proyecto: any, format: "pdf" | "docx") => {
    try {
      if (format === "pdf") {
        // Usar la librería original mejorada para generar PDF
        const { generateProyectoPDF } = await import('@/lib/pdf-generator')
        generateProyectoPDF(proyecto)
        
        toast({
          title: "PDF descargado",
          description: `El proyecto "${proyecto.nombre}" se ha descargado exitosamente.`,
          variant: "default"
        })
      } else if (format === "docx") {
        // Usar la nueva función de generación de Word para proyectos
        const { generateProyectoDocx } = await import('@/lib/docx-generator')
        await generateProyectoDocx(proyecto)
        
        toast({
          title: "Documento Word descargado",
          description: `El proyecto "${proyecto.nombre}" se ha descargado en formato Word exitosamente.`,
          variant: "default"
        })
      }
    } catch (error) {
      console.error('Error descargando archivo:', error)
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el archivo. Inténtalo de nuevo.",
        variant: "destructive"
      })
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800'
      case 'archivado':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }


  // Si estamos en modo view, mostrar la vista del proyecto
  if (viewMode === "view" && selectedProyecto) {
    return (
      <ViewProyecto
        proyectoId={selectedProyecto}
        onBack={handleBack}
      />
    )
  }

  return (
    <BetaFeatureWrapper 
      featureKey="proyectos" 
      fallback={<BetaAccessDenied featureName="Módulo de Proyectos" className="max-w-6xl mx-auto" />}
      showBadge={false}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Proyectos</h1>
            <p className="text-lg text-gray-600 mt-2">
              Gestiona y visualiza todos tus proyectos educativos
            </p>
          </div>
          <Button 
            onClick={handleCrearNuevo}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Proyecto</span>
          </Button>
        </div>

        {/* Lista de Proyectos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando proyectos...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p className="font-medium">Error cargando proyectos</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : proyectos.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tienes proyectos aún
                </h3>
                <p className="text-gray-600 mb-6">
                  Crea tu primer proyecto educativo y comienza a generar contenido con IA
                </p>
                <Button 
                  onClick={handleCrearNuevo}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear mi Primer Proyecto</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((proyecto) => (
              <Card key={proyecto.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {proyecto.nombre}
                    </CardTitle>
                    <Badge className={`text-xs ${getEstadoColor(proyecto.estado)}`}>
                      {proyecto.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Información del grupo */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{proyecto.grupos.nombre} - {proyecto.grupos.grado}° {proyecto.grupos.nivel}</span>
                  </div>

                  {/* Metodología */}
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="line-clamp-1">{proyecto.metodologia_nem}</span>
                  </div>

                  {/* Fecha de creación */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(proyecto.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Problemática (preview) */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {proyecto.problematica}
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerProyecto(proyecto.id)}
                      className="flex-1 flex items-center justify-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Ver</span>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleDownload(proyecto, "pdf")}>
                          Descargar como PDF
                        </DropdownMenuItem>
                        {profile && isUserPro(profile) ? (
                          <DropdownMenuItem onClick={() => handleDownload(proyecto, "docx")}>
                            Descargar para Word
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled className="text-gray-500 dark:text-gray-400">
                            Descargar para Word (Solo Pro)
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto
                            <strong> "{proyecto.nombre}"</strong> y todos sus datos asociados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleEliminarProyecto(proyecto.id, proyecto.nombre)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BetaFeatureWrapper>
  )
}
