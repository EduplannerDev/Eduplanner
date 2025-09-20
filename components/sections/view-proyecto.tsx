"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Users, Calendar, Target, Lightbulb, Loader2 } from 'lucide-react'
import { useProyectos } from '@/hooks/use-proyectos'
import { useState, useEffect } from 'react'

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
  const { obtenerProyecto, obtenerFasesProyecto, loading, error } = useProyectos()
  const [proyecto, setProyecto] = useState<ProyectoCompleto | null>(null)
  const [fases, setFases] = useState<ProyectoFase[]>([])
  const [loadingFases, setLoadingFases] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

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
            <Badge variant="outline" className="text-sm">
              {proyecto.estado}
            </Badge>
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
    </div>
  )
}
