"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, BookOpen, Users, Target, Lightbulb } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProyectoFormData, GrupoOption, MetodologiaOption } from '@/types/proyectos'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { BetaFeatureWrapper, BetaAccessDenied } from '@/components/ui/beta-feature-wrapper'

interface ProyectoWizardStep1Props {
  data: ProyectoFormData
  onDataChange: (data: ProyectoFormData) => void
  onNext: () => void
  loading?: boolean
}

// Opciones predefinidas de metodologías NEM
const metodologiasNEM: MetodologiaOption[] = [
  {
    value: "Aprendizaje Basado en Proyectos Comunitarios",
    label: "Aprendizaje Basado en Proyectos Comunitarios",
    description: "Los estudiantes desarrollan proyectos que impactan positivamente en su comunidad"
  },
  {
    value: "Aprendizaje Basado en Problemas",
    label: "Aprendizaje Basado en Problemas",
    description: "Los estudiantes resuelven problemas reales del mundo actual"
  },
  {
    value: "Aprendizaje Basado en Investigación",
    label: "Aprendizaje Basado en Investigación",
    description: "Los estudiantes investigan temas de interés y presentan sus hallazgos"
  },
  {
    value: "Aprendizaje Basado en Servicio",
    label: "Aprendizaje Basado en Servicio",
    description: "Los estudiantes prestan servicios a la comunidad mientras aprenden"
  },
  {
    value: "Aprendizaje Colaborativo",
    label: "Aprendizaje Colaborativo",
    description: "Los estudiantes trabajan en equipo para lograr objetivos comunes"
  },
  {
    value: "Aprendizaje Basado en Casos",
    label: "Aprendizaje Basado en Casos",
    description: "Los estudiantes analizan casos reales y proponen soluciones"
  }
]

export function ProyectoWizardStep1({ data, onDataChange, onNext, loading = false }: ProyectoWizardStep1Props) {
  const { user } = useAuth()
  const [grupos, setGrupos] = useState<GrupoOption[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [gruposError, setGruposError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<ProyectoFormData>>({})

  // Cargar grupos del profesor
  useEffect(() => {
    async function loadGrupos() {
      if (!user?.id) return

      try {
        setLoadingGrupos(true)
        setGruposError(null)
        const { data: gruposData, error } = await supabase
          .from('grupos')
          .select(`
            id,
            nombre,
            grado,
            nivel,
            plantel_id
          `)
          .eq('user_id', user.id)
          .eq('activo', true)
          .order('grado', { ascending: true })

        if (error) {
          console.error('Error cargando grupos:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          setGruposError(`Error al cargar grupos: ${error.message}`)
          return
        }

        setGrupos(gruposData || [])
      } catch (error) {
        console.error('Error cargando grupos:', {
          message: error instanceof Error ? error.message : 'Error desconocido',
          error: error
        })
        setGruposError('Error inesperado al cargar grupos')
      } finally {
        setLoadingGrupos(false)
      }
    }

    loadGrupos()
  }, [user?.id])

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Partial<ProyectoFormData> = {}

    if (!data.nombre.trim()) {
      newErrors.nombre = 'El nombre del proyecto es requerido'
    } else if (data.nombre.trim().length < 5) {
      newErrors.nombre = 'El nombre debe tener al menos 5 caracteres'
    }

    if (!data.problematica.trim()) {
      newErrors.problematica = 'La problemática es requerida'
    } else if (data.problematica.trim().length < 20) {
      newErrors.problematica = 'La problemática debe tener al menos 20 caracteres'
    }

    if (!data.producto_final.trim()) {
      newErrors.producto_final = 'El producto final es requerido'
    } else if (data.producto_final.trim().length < 10) {
      newErrors.producto_final = 'El producto final debe tener al menos 10 caracteres'
    }

    if (!data.grupo_id) {
      newErrors.grupo_id = 'Debes seleccionar un grupo'
    }

    if (!data.metodologia_nem) {
      newErrors.metodologia_nem = 'Debes seleccionar una metodología'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar cambio de datos
  const handleDataChange = (field: keyof ProyectoFormData, value: string) => {
    const newData = { ...data, [field]: value }
    onDataChange(newData)
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Manejar siguiente paso
  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  // Verificar si el formulario está completo
  const isFormComplete = data.nombre.trim() && 
                        data.problematica.trim() && 
                        data.producto_final.trim() && 
                        data.grupo_id && 
                        data.metodologia_nem

  return (
    <BetaFeatureWrapper 
      featureKey="proyectos" 
      fallback={<BetaAccessDenied featureName="Módulo de Proyectos" className="max-w-4xl mx-auto" />}
      showBadge={true}
      badgePosition="top-right"
    >
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Define tu Proyecto</h1>
        </div>
        <p className="text-lg text-gray-600">
          Comienza definiendo la información básica de tu proyecto educativo
        </p>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Información del Proyecto</span>
          </CardTitle>
          <CardDescription>
            Proporciona los detalles fundamentales de tu proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nombre del Proyecto */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium">
              Nombre del Proyecto *
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Campaña de reciclaje en la escuela"
              value={data.nombre}
              onChange={(e) => handleDataChange('nombre', e.target.value)}
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.nombre}</span>
              </p>
            )}
          </div>

          {/* Problemática */}
          <div className="space-y-2">
            <Label htmlFor="problematica" className="text-sm font-medium">
              Problemática o Tema Central *
            </Label>
            <Textarea
              id="problematica"
              placeholder="Describe la problemática o tema que abordará el proyecto. Ej: La falta de conciencia ambiental en la comunidad escolar ha generado un aumento en la generación de residuos..."
              value={data.problematica}
              onChange={(e) => handleDataChange('problematica', e.target.value)}
              className={`min-h-[120px] ${errors.problematica ? 'border-red-500' : ''}`}
            />
            <div className="flex justify-between items-center">
              {errors.problematica ? (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.problematica}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Mínimo 20 caracteres
                </p>
              )}
              <p className="text-sm text-gray-500">
                {data.problematica.length} caracteres
              </p>
            </div>
          </div>

          {/* Producto Final */}
          <div className="space-y-2">
            <Label htmlFor="producto_final" className="text-sm font-medium">
              Producto Final *
            </Label>
            <Input
              id="producto_final"
              placeholder="Ej: Una campaña de concientización con carteles y folletos"
              value={data.producto_final}
              onChange={(e) => handleDataChange('producto_final', e.target.value)}
              className={errors.producto_final ? 'border-red-500' : ''}
            />
            {errors.producto_final && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.producto_final}</span>
              </p>
            )}
          </div>

          {/* Grupo */}
          <div className="space-y-2">
            <Label htmlFor="grupo" className="text-sm font-medium">
              Grupo *
            </Label>
            <Select
              value={data.grupo_id}
              onValueChange={(value) => handleDataChange('grupo_id', value)}
            >
              <SelectTrigger className={errors.grupo_id ? 'border-red-500' : ''}>
                <SelectValue placeholder={loadingGrupos ? "Cargando grupos..." : "Selecciona un grupo"} />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{grupo.nombre} - {grupo.grado}° {grupo.nivel}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.grupo_id && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.grupo_id}</span>
              </p>
            )}
            {gruposError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {gruposError}
                </AlertDescription>
              </Alert>
            )}
            {grupos.length === 0 && !loadingGrupos && !gruposError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No tienes grupos asignados. Contacta a tu administrador para asignarte grupos.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Metodología NEM */}
          <div className="space-y-2">
            <Label htmlFor="metodologia" className="text-sm font-medium">
              Metodología NEM *
            </Label>
            <Select
              value={data.metodologia_nem}
              onValueChange={(value) => handleDataChange('metodologia_nem', value)}
            >
              <SelectTrigger className={errors.metodologia_nem ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona una metodología" />
              </SelectTrigger>
              <SelectContent>
                {metodologiasNEM.map((metodologia) => (
                  <SelectItem key={metodologia.value} value={metodologia.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{metodologia.label}</div>
                      <div className="text-sm text-gray-500">{metodologia.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.metodologia_nem && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.metodologia_nem}</span>
              </p>
            )}
          </div>

          {/* Resumen del Proyecto */}
          {isFormComplete && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-800">Resumen del Proyecto</h3>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Nombre:</strong> {data.nombre}</p>
                <p><strong>Grupo:</strong> {grupos.find(g => g.id === data.grupo_id)?.nombre}</p>
                <p><strong>Metodología:</strong> {data.metodologia_nem}</p>
                <p><strong>Producto Final:</strong> {data.producto_final}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón Siguiente */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!isFormComplete || loading}
          className="px-8 py-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Procesando...
            </>
          ) : (
            <>
              Siguiente Paso
              <Lightbulb className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      </div>
    </BetaFeatureWrapper>
  )
}
