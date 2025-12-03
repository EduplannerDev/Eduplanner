"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, BookOpen, Users, Target, Lightbulb } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ProyectoFormData, GrupoOption, MetodologiaOption } from '@/types/proyectos'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

interface ProyectoWizardStep1Props {
  data: ProyectoFormData
  onDataChange: (data: ProyectoFormData) => void
  onNext: () => void
  loading?: boolean
  onSectionChange?: (section: string) => void
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

export function ProyectoWizardStep1({ data, onDataChange, onNext, loading = false, onSectionChange }: ProyectoWizardStep1Props) {
  const { user } = useAuth()
  const [grupos, setGrupos] = useState<GrupoOption[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [gruposError, setGruposError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<ProyectoFormData>>({})

  // Estados para integración con Plan Analítico
  const [origenProyecto, setOrigenProyecto] = useState<'libre' | 'plan_analitico'>('libre')
  const [problematicasPlan, setProblematicasPlan] = useState<any[]>([])
  const [loadingProblematicas, setLoadingProblematicas] = useState(false)
  const [showEnrichmentTip, setShowEnrichmentTip] = useState(false)

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
          console.error('Error cargando grupos:', error)
          setGruposError(`Error al cargar grupos: ${error.message}`)
          return
        }

        setGrupos(gruposData || [])
      } catch (error) {
        console.error('Error cargando grupos:', error)
        setGruposError('Error inesperado al cargar grupos')
      } finally {
        setLoadingGrupos(false)
      }
    }

    loadGrupos()
  }, [user?.id])

  // Cargar problemáticas del Plan Analítico cuando se selecciona un grupo y el origen es 'plan_analitico'
  useEffect(() => {
    async function loadProblematicasPlan() {
      if (!data.grupo_id || origenProyecto !== 'plan_analitico') return

      setLoadingProblematicas(true)
      try {
        // 1. Obtener el plan analítico del grupo (el más reciente)
        const { data: plan, error: planError } = await supabase
          .from('planes_analiticos')
          .select('id')
          .eq('grupo_id', data.grupo_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (planError) {
          if (planError.code !== 'PGRST116') { // Ignorar error si no hay plan
            console.error('Error buscando plan analítico:', planError)
          }
          setProblematicasPlan([])
          return
        }

        if (plan) {
          // 2. Obtener las problemáticas del plan
          const { data: problematicas, error: probError } = await supabase
            .from('plan_analitico_problematicas')
            .select('id, titulo, descripcion')
            .eq('plan_id', plan.id)

          if (probError) throw probError
          setProblematicasPlan(problematicas || [])
        }
      } catch (error) {
        console.error('Error cargando problemáticas:', error)
        setProblematicasPlan([])
      } finally {
        setLoadingProblematicas(false)
      }
    }

    loadProblematicasPlan()
  }, [data.grupo_id, origenProyecto])

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

  // Manejar selección de problemática del plan
  const handleProblematicaSelect = (problematicaId: string) => {
    const selectedProb = problematicasPlan.find(p => p.id === problematicaId)
    if (selectedProb) {
      const hasDescription = selectedProb.descripcion && selectedProb.descripcion.trim().length > 0
      const newData = {
        ...data,
        problematica: hasDescription ? selectedProb.descripcion : selectedProb.titulo,
        plan_analitico_problematica_id: problematicaId
      }
      onDataChange(newData)
      setShowEnrichmentTip(!hasDescription)

      // Limpiar error si existía
      if (errors.problematica) {
        setErrors(prev => ({ ...prev, problematica: undefined }))
      }
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
    <div className="max-w-4xl mx-auto space-y-6 w-full max-w-full overflow-hidden px-2 sm:px-0 pb-20 sm:pb-6">
      {/* Botón Siguiente - Solo visible en desktop */}
      <div className="hidden sm:flex justify-end">
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

      {/* Header */}
      <div className="text-center space-y-2 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-center space-x-2">
          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">Define tu Proyecto</h1>
        </div>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 break-words">
          Comienza definiendo la información básica de tu proyecto educativo
        </p>
      </div>

      {/* Formulario */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="w-full max-w-full overflow-hidden">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg break-words leading-tight">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="break-words overflow-hidden">Información del Proyecto</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words">
            Proporciona los detalles fundamentales de tu proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 w-full max-w-full overflow-hidden">

          {/* Selector de Origen */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <Label className="text-base font-semibold mb-3 block">¿Cómo quieres iniciar este proyecto?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`cursor-pointer border rounded-lg p-4 flex items-center space-x-3 transition-all ${origenProyecto === 'libre' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'hover:border-gray-400'}`}
                onClick={() => setOrigenProyecto('libre')}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${origenProyecto === 'libre' ? 'border-blue-500' : 'border-gray-400'}`}>
                  {origenProyecto === 'libre' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <div>
                  <p className="font-medium">Proyecto Libre</p>
                  <p className="text-xs text-gray-500">Escribe tu propia problemática desde cero</p>
                </div>
              </div>

              <div
                className={`cursor-pointer border rounded-lg p-4 flex items-center space-x-3 transition-all ${origenProyecto === 'plan_analitico' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500' : 'hover:border-gray-400'}`}
                onClick={() => setOrigenProyecto('plan_analitico')}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${origenProyecto === 'plan_analitico' ? 'border-purple-500' : 'border-gray-400'}`}>
                  {origenProyecto === 'plan_analitico' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                </div>
                <div>
                  <p className="font-medium">Desde mi Plan Analítico</p>
                  <p className="text-xs text-gray-500">Usa una problemática ya diagnosticada</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nombre del Proyecto */}
          <div className="space-y-2 w-full max-w-full overflow-hidden">
            <Label htmlFor="nombre" className="text-sm font-medium break-words">
              Nombre del Proyecto *
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Campaña de reciclaje en la escuela"
              value={data.nombre}
              onChange={(e) => handleDataChange('nombre', e.target.value)}
              className={`w-full max-w-full ${errors.nombre ? 'border-red-500' : ''}`}
            />
            {errors.nombre && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.nombre}</span>
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
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
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

            {/* Alerta prominente cuando no hay grupos disponibles */}
            {grupos.length === 0 && !loadingGrupos && !gruposError && (
              <Alert variant="destructive" className="border-2 border-red-500 bg-red-50 dark:bg-red-950/50 shadow-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-2">⚠️ ¡ATENCIÓN! No puedes crear proyectos</h3>
                      <p className="text-base">
                        <strong>Para crear un proyecto necesitas tener al menos un grupo asignado.</strong>
                        <br />
                        Primero debes crear un grupo en el módulo correspondiente.
                      </p>
                    </div>
                    <Button
                      onClick={() => onSectionChange?.('grupos')}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-base px-6 py-3 shadow-lg transform hover:scale-105 transition-all duration-200"
                      size="lg"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      🚀 GENERAR GRUPO AHORA
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

          </div>

          {/* Selector de Problemática del Plan (Condicional) */}
          {origenProyecto === 'plan_analitico' && data.grupo_id && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
              <Label htmlFor="problematica_plan" className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Selecciona una Problemática del Plan *
              </Label>
              <Select
                value={data.plan_analitico_problematica_id || ''}
                onValueChange={handleProblematicaSelect}
                disabled={loadingProblematicas}
              >
                <SelectTrigger className="border-purple-200 ring-purple-200 focus:ring-purple-500">
                  <SelectValue placeholder={loadingProblematicas ? "Cargando problemáticas..." : "Selecciona una problemática..."} />
                </SelectTrigger>
                <SelectContent>
                  {problematicasPlan.length > 0 ? (
                    problematicasPlan.map((prob) => (
                      <SelectItem key={prob.id} value={prob.id}>
                        {prob.titulo}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      {loadingProblematicas ? "Cargando..." : "No hay problemáticas en el plan de este grupo"}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {problematicasPlan.length === 0 && !loadingProblematicas && (
                <p className="text-xs text-amber-600">Este grupo no tiene un Plan Analítico con problemáticas registradas.</p>
              )}
            </div>
          )}

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
              className={`min-h-[120px] ${errors.problematica ? 'border-red-500' : ''} ${origenProyecto === 'plan_analitico' ? 'bg-purple-50/30' : ''}`}
            />

            {/* Tip de enriquecimiento (Alta visibilidad) */}
            {showEnrichmentTip && origenProyecto === 'plan_analitico' && (
              <Alert className="bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-100 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-200 font-bold">¡Importante para la IA!</AlertTitle>
                <AlertDescription className="font-medium">
                  Enriquece esta descripción con detalles específicos de tu grupo.
                  <span className="block mt-1 font-normal opacity-90">
                    Entre más contexto agregues aquí, la IA generará un proyecto mucho más preciso y útil para ti.
                  </span>
                </AlertDescription>
              </Alert>
            )}

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
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.producto_final}</span>
              </p>
            )}
          </div>

          {/* Metodología NEM */}
          <div className="space-y-2 w-full max-w-full overflow-hidden">
            <Label htmlFor="metodologia" className="text-sm font-medium break-words">
              Metodología NEM *
            </Label>
            <Select
              value={data.metodologia_nem}
              onValueChange={(value) => handleDataChange('metodologia_nem', value)}
            >
              <SelectTrigger className={`w-full max-w-full ${errors.metodologia_nem ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecciona una metodología" />
              </SelectTrigger>
              <SelectContent
                className="w-full max-w-full min-w-[280px] sm:min-w-[400px]"
                style={{
                  maxWidth: 'calc(100vw - 2rem)',
                  width: '100%'
                }}
              >
                {metodologiasNEM.map((metodologia) => (
                  <SelectItem
                    key={metodologia.value}
                    value={metodologia.value}
                    className="w-full max-w-full p-3 cursor-pointer"
                    style={{
                      maxWidth: '100%',
                      width: '100%',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    <div
                      className="space-y-1 w-full max-w-full"
                      style={{
                        maxWidth: '100%',
                        width: '100%',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    >
                      <div
                        className="font-medium leading-tight text-left"
                        style={{
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {metodologia.label}
                      </div>
                      <div
                        className="text-sm text-gray-500 leading-tight text-left"
                        style={{
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {metodologia.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.metodologia && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.metodologia}</span>
              </p>
            )}
          </div>

          {/* Resumen del Proyecto */}
          {isFormComplete && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-medium text-green-800 dark:text-green-200">Resumen del Proyecto</h3>
              </div>
              <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                <p><strong>Nombre:</strong> {data.nombre}</p>
                <p><strong>Grupo:</strong> {grupos.find(g => g.id === data.grupo_id)?.nombre}</p>
                <p><strong>Metodología:</strong> {data.metodologia_nem}</p>
                <p><strong>Producto Final:</strong> {data.producto_final}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón flotante para móviles */}
      <div className="sm:hidden fixed bottom-4 left-4 z-50">
        <Button
          onClick={handleNext}
          disabled={!isFormComplete || loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-full w-14 h-14"
          size="icon"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Lightbulb className="h-5 w-5" />
          )}
        </Button>
      </div>

    </div>
  )
}
