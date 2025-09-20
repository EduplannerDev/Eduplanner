"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { useProyectoWizard } from '@/hooks/use-proyecto-wizard'
import { useProyectos } from '@/hooks/use-proyectos'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { ProyectoWizardStep1 } from './proyecto-wizard-step1'
import { ProyectoWizardStep2 } from './proyecto-wizard-step2'
import { BetaFeatureWrapper, BetaAccessDenied } from '@/components/ui/beta-feature-wrapper'

interface ProyectoWizardProps {
  onComplete?: () => void
}

export function ProyectoWizard({ onComplete }: ProyectoWizardProps = {}) {
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
  const [isSaving, setIsSaving] = useState(false)

  // Calcular progreso
  const progress = (currentStep / 3) * 100

  // Manejar guardar proyecto
  const handleSaveProject = async () => {
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
      console.error('Error guardando proyecto:', error)
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
    switch (currentStep) {
      case 1:
        return (
          <ProyectoWizardStep1
            data={getStep1FormData()}
            onDataChange={updateStep1Data}
            onNext={goToNextStep}
            loading={loading}
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
          />
        )
      case 3:
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Generar Plan Didáctico</h1>
              <p className="text-lg text-gray-600">
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
                    <p className="text-lg font-medium text-gray-900">
                      🤖 Analizando tu proyecto con Gemini...
                    </p>
                    <p className="text-sm text-gray-600">
                      Generando fases y momentos personalizados para: <strong>{wizardData.nombre}</strong>
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Procesando:</strong> {wizardData.pdas_seleccionados.length} PDAs seleccionados
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Metodología:</strong> {wizardData.metodologia_nem}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Navegación para el Paso 3 */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={loading || isSaving}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>

              <Button
                onClick={handleSaveProject}
                disabled={loading || isSaving}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generando y Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Generar y Crear Proyecto</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }


  return (
    <BetaFeatureWrapper 
      featureKey="proyectos" 
      fallback={<BetaAccessDenied featureName="Módulo de Proyectos" className="max-w-6xl mx-auto" />}
      showBadge={false}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header con progreso */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Asistente de Proyectos</h1>
            <p className="text-lg text-gray-600">
              Crea tu proyecto educativo paso a paso
            </p>
          </div>
          
          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Navegación de pasos */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={!isStepCompleted(step.id - 1) && step.id > 1}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                      step.current 
                        ? 'bg-blue-100 text-blue-700' 
                        : isStepCompleted(step.id)
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'text-gray-400 hover:text-gray-600'
                    } ${!isStepCompleted(step.id - 1) && step.id > 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isStepCompleted(step.id) ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                    <div className="text-left">
                      <div className="font-medium">{step.title}</div>
                      <div className="text-xs opacity-75">{step.description}</div>
                    </div>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div className="w-8 h-px bg-gray-300 mx-4"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contenido del paso actual */}
        <div className="min-h-[600px]">
          {renderStepContent()}
        </div>

      </div>
    </BetaFeatureWrapper>
  )
}
