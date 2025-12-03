"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { useProyectoWizard } from '@/hooks/use-proyecto-wizard'
import { useProyectos } from '@/hooks/use-proyectos'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { canUserCreate } from '@/lib/subscription-utils'
import { ProyectoWizardStep1 } from './proyecto-wizard-step1'
import { ProyectoWizardStep2 } from './proyecto-wizard-step2'

interface ProyectoWizardProps {
  onComplete?: () => void
  onSectionChange?: (section: string) => void
}

export function ProyectoWizard({ onComplete, onSectionChange }: ProyectoWizardProps = {}) {
  const {
    currentStep,
    wizardData,
    loading,
    steps,
    updateStep1Data,
    updateSelectedPdas,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetWizard,
    setLoading,
    isStepCompleted,
    getStep1FormData,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep
  } = useProyectoWizard()

  const { crearProyecto, loading: savingProject, error: projectError } = useProyectos()
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [projectLimits, setProjectLimits] = useState<{
    canCreate: boolean;
    currentCount: number;
    limit: number;
    message?: string;
  } | null>(null)

  // Calcular progreso
  const progress = (currentStep / 3) * 100

  // Efecto para cargar límites de proyectos
  useEffect(() => {
    const cargarLimitesProyectos = async () => {
      if (!user) return

      try {
        const limits = await canUserCreate(user.id, 'proyectos')
        setProjectLimits(limits)
      } catch (error) {
        console.error('Error cargando límites de proyectos:', error)
      }
    }

    cargarLimitesProyectos()
  }, [user])

  // Efecto para ejecutar automáticamente la generación cuando se entra al paso 3
  useEffect(() => {
    if (currentStep === 3 && !isSaving) {
      handleSaveProject()
    }
  }, [currentStep])

  // Manejar guardar proyecto
  const handleSaveProject = async () => {
    // Verificar límites antes de crear el proyecto
    if (projectLimits && !projectLimits.canCreate) {
      toast({
        title: "🎉 ¡Felicitaciones! Has creado tu proyecto.",
        description: `Has alcanzado el límite de ${projectLimits.limit} proyectos en el plan gratuito. 💫 Desbloquea tu potencial educativo con PRO: crea proyectos ilimitados y desarrolla experiencias de aprendizaje innovadoras.`,
        variant: "default",
        duration: 8000, // Mostrar por más tiempo
        action: (
          <button
            onClick={() => {
              window.open('/pricing', '_blank')
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Upgrade a PRO
          </button>
        )
      })
      return
    }

    setIsSaving(true)

    try {
      // Validar que tenemos todos los datos necesarios
      if (!wizardData.nombre || !wizardData.problematica || !wizardData.producto_final ||
        !wizardData.grupo_id || !wizardData.metodologia_nem) {
        throw new Error('Faltan datos obligatorios del proyecto')
      }

      if (wizardData.pdas_seleccionados.length === 0) {
        throw new Error('Debes seleccionar al menos un PDA')
      }

      // Crear el proyecto en la base de datos (esto incluye generación de contenido con IA)
      const resultado = await crearProyecto({
        nombre: wizardData.nombre,
        problematica: wizardData.problematica,
        producto_final: wizardData.producto_final,
        metodologia_nem: wizardData.metodologia_nem,
        grupo_id: wizardData.grupo_id,
        pdas_seleccionados: wizardData.pdas_seleccionados
      })

      if (!resultado) {
        throw new Error(projectError || 'Error al crear el proyecto')
      }

      // Mostrar mensaje de éxito
      toast({
        title: "¡Proyecto creado exitosamente!",
        description: `El proyecto "${resultado.proyecto.nombre}" ha sido creado y su contenido generado con IA.`,
        variant: "default"
      })

      // Resetear el asistente
      resetWizard()

      // Llamar a onComplete si está disponible
      if (onComplete) {
        onComplete()
      }

    } catch (error) {
      toast({
        title: "Error al crear el proyecto",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Renderizar el contenido del paso actual
  const renderStepContent = () => {
    // Si el usuario ha alcanzado el límite, mostrar mensaje en lugar del wizard
    if (projectLimits && !projectLimits.canCreate) {
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">🎉 ¡Felicitaciones!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="text-6xl">🎊</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Has alcanzado el límite de proyectos
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Has creado exitosamente <strong>{projectLimits.currentCount} proyectos</strong> en el plan gratuito.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  💫 Desbloquea tu potencial educativo con PRO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Proyectos ilimitados</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Generación de contenido avanzada</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Exportación a Word (DOCX)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Soporte prioritario</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      window.open('/pricing', '_blank')
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Upgrade a PRO
                  </button>
                  <button
                    onClick={() => {
                      if (onComplete) {
                        onComplete()
                      }
                    }}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Ver mis proyectos
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    switch (currentStep) {
      case 1:
        return (
          <ProyectoWizardStep1
            data={getStep1FormData()}
            onDataChange={updateStep1Data}
            onNext={goToNextStep}
            loading={loading}
            onSectionChange={onSectionChange}
          />
        )
      case 2:
        return (
          <ProyectoWizardStep2
            grupoId={wizardData.grupo_id}
            problematica={wizardData.problematica}
            selectedPdas={wizardData.pdas_seleccionados}
            onPdasChange={updateSelectedPdas}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            loading={loading || isSaving}
            planAnaliticoProblematicaId={wizardData.plan_analitico_problematica_id}
          />
        )
      case 3:
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Solo mostrar botón Anterior - Movido arriba */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={loading || isSaving}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Generar Plan Didáctico</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                La IA está generando las fases y momentos de tu proyecto
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Paso 3: Generación con IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      🤖 Analizando tu proyecto...
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generando fases y momentos personalizados para: <strong>{wizardData.nombre}</strong>
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Procesando:</strong> {wizardData.pdas_seleccionados.length} PDAs seleccionados
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Metodología:</strong> {wizardData.metodologia_nem}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                      💡 Este proceso puede tomar entre 30-60 segundos dependiendo de la complejidad
                    </p>
                  </div>

                  {/* Indicador de progreso más detallado */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Conectando con IA...</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )
      default:
        return null
    }
  }


  return (
    <div className="max-w-6xl mx-auto space-y-6 w-full max-w-full overflow-hidden px-2 sm:px-0">
      {/* Header con progreso - Solo mostrar si no ha alcanzado el límite */}
      {(!projectLimits || projectLimits.canCreate) && (
        <div className="space-y-4 w-full max-w-full overflow-hidden">
          <div className="text-center space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">Asistente de Proyectos</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 break-words">
              Crea tu proyecto educativo paso a paso
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}

      {/* Navegación de pasos - Solo mostrar si no ha alcanzado el límite */}
      {(!projectLimits || projectLimits.canCreate) && (
        <Card className="w-full max-w-full overflow-hidden">
          <CardContent className="p-3 sm:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 w-full max-w-full overflow-hidden">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center w-full sm:w-auto">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={!isStepCompleted(step.id - 1) && step.id > 1}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors w-full sm:w-auto ${step.current
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : isStepCompleted(step.id)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                      } ${!isStepCompleted(step.id - 1) && step.id > 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isStepCompleted(step.id) ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    )}
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base break-words">{step.title}</div>
                      <div className="text-xs opacity-75 break-words hidden sm:block">{step.description}</div>
                    </div>
                  </button>

                  {index < steps.length - 1 && (
                    <div className="hidden sm:block w-8 h-px bg-gray-300 dark:bg-gray-600 mx-4"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenido del paso actual */}
      <div className="min-h-[400px] sm:min-h-[600px] w-full max-w-full overflow-hidden">
        {renderStepContent()}
      </div>

    </div>
  )
}
