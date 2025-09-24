"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Users, Calendar, Target, Lightbulb, Loader2, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useProyectos } from '@/hooks/use-proyectos'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ViewProyectoProps {
  proyectoId: string
  onBack: () => void
}

interface ProyectoFase {
  id: string
  fase_nombre: string
  momento_nombre: string
  contenido: string
  orden: number
}

interface ProyectoCompleto {
  id: string
  nombre: string
  problematica: string
  producto_final: string
  metodologia_nem: string
  estado: string
  created_at: string
  grupos: {
    nombre: string
    grado: string
    nivel: string
  }
  fases: ProyectoFase[]
}

export function ViewProyecto({ proyectoId, onBack }: ViewProyectoProps) {
  const router = useRouter()
  const { obtenerProyecto, obtenerFasesProyecto, loading, error } = useProyectos()
  const [proyecto, setProyecto] = useState<ProyectoCompleto | null>(null)
  const [fases, setFases] = useState<ProyectoFase[]>([])
  const [loadingFases, setLoadingFases] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showInstrumentDialog, setShowInstrumentDialog] = useState(false)
  const [generatingRubrica, setGeneratingRubrica] = useState(false)

  useEffect(() => {
    cargarProyecto()
  }, [proyectoId])

  const cargarProyecto = async () => {
    setInitialLoading(true)
    setHasError(false)
    
    try {
      const proyectoData = await obtenerProyecto(proyectoId)
      if (proyectoData) {
        setProyecto({
          ...proyectoData,
          fases: [] // Se cargará por separado
        })
        
        // Cargar las fases del proyecto
        await cargarFases()
      } else {
        setHasError(true)
      }
    } catch (error) {
      console.error('Error cargando proyecto:', error)
      setHasError(true)
    } finally {
      setInitialLoading(false)
    }
  }

  const cargarFases = async () => {
    setLoadingFases(true)
    try {
      const fasesData = await obtenerFasesProyecto(proyectoId)
      setFases(fasesData)
      
      // Actualizar el proyecto con las fases cargadas
      if (proyecto) {
        setProyecto({
          ...proyecto,
          fases: fasesData
        })
      }
    } catch (error) {
      console.error('Error cargando fases:', error)
    } finally {
      setLoadingFases(false)
    }
  }

  // Mostrar loader inicial mientras se carga el proyecto
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  // Solo mostrar error si realmente hay un error después de cargar
  if (hasError || (!proyecto && !initialLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Proyecto no encontrado</h1>
          <p className="text-gray-600 mb-6">El proyecto solicitado no existe o no tienes permisos para verlo.</p>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
        </div>
      </div>
    )
  }

  // Pantalla de espera "Magia de la IA" para generación de rúbrica
  if (generatingRubrica) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ Magia de la IA ✨
            </h1>
            <p className="text-lg text-gray-600">
              La IA está generando tu rúbrica analítica personalizada
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Generación con IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    🤖 Analizando tu proyecto con Gemini...
                  </p>
                  <p className="text-sm text-gray-600">
                    Creando criterios de evaluación para: <strong>{proyecto?.nombre}</strong>
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Procesando:</strong> Fases y momentos del proyecto
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Metodología:</strong> {proyecto?.metodologia_nem}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Grupo:</strong> {proyecto?.grupos?.nombre} - {proyecto?.grupos?.grado}° {proyecto?.grupos?.nivel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{proyecto.nombre}</h1>
              <p className="text-lg text-gray-600 mt-2">{proyecto.grupos.nombre} - {proyecto.grupos.grado}° {proyecto.grupos.nivel}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setShowInstrumentDialog(true)}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Crear Instrumento de Evaluación
              </Button>
            </div>
          </div>
        </div>

        {/* Información del Proyecto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Problemática
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{proyecto.problematica}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                Producto Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{proyecto.producto_final}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Lightbulb className="h-5 w-5 mr-2 text-purple-600" />
                Metodología
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{proyecto.metodologia_nem}</p>
            </CardContent>
          </Card>
        </div>

        {/* Fases del Proyecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-orange-600" />
              Fases y Momentos del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFases ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando fases del proyecto...</p>
              </div>
            ) : fases.length > 0 ? (
              <div className="space-y-6">
                {fases.map((fase, index) => (
                  <div key={fase.id} className="border-l-4 border-blue-500 pl-6">
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg text-blue-700">{fase.fase_nombre}</h3>
                      <h4 className="font-medium text-md text-gray-700">{fase.momento_nombre}</h4>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {fase.contenido}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron fases para este proyecto.</p>
                <p className="text-sm mt-2">Las fases se generan automáticamente cuando se crea el proyecto.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    
      {/* Modal de selección de tipo de instrumento */}
      <Dialog open={showInstrumentDialog} onOpenChange={setShowInstrumentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Qué tipo de instrumento quieres crear?</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de instrumento de evaluación que deseas crear para este proyecto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button 
              onClick={async () => {
                setShowInstrumentDialog(false);
                setGeneratingRubrica(true);
                
                try {
                  toast.info("Generando rúbrica analítica...", {
                    description: "Esto puede tomar unos segundos",
                    duration: 3000
                  });
                  
                  const response = await fetch('/api/generate-rubrica', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      proyecto_id: proyectoId
                    }),
                    cache: 'no-store'
                  });
                  
                  if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  
                  toast.success("¡Rúbrica generada con éxito!", {
                    description: "Ya puedes utilizarla para evaluar el proyecto"
                  });
                  
                  // Aquí se implementaría la redirección a la vista de la rúbrica
                  // Por ahora, solo mostramos un mensaje de éxito
                  
                } catch (error) {
                  console.error("Error al generar la rúbrica:", error);
                  toast.error("Error al generar la rúbrica", {
                    description: error instanceof Error ? error.message : "Ocurrió un error inesperado"
                  });
                } finally {
                  setGeneratingRubrica(false);
                }
              }}
              className="flex items-center justify-center gap-2 h-16"
              variant="outline"
              disabled={generatingRubrica}
            >
              {generatingRubrica ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <BookOpen className="h-5 w-5 text-blue-600" />
              )}
              <span className="font-medium">
                {generatingRubrica ? "Generando..." : "Rúbrica Analítica"}
              </span>
            </Button>
            
            <Button 
              onClick={() => {
                alert("Lista de Cotejo - Función futura");
                setShowInstrumentDialog(false);
              }}
              className="flex items-center justify-center gap-2 h-16"
              variant="outline"
              disabled
            >
              <CheckSquare className="h-5 w-5 text-gray-400" />
              <span className="font-medium">Lista de Cotejo</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Próximamente</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
