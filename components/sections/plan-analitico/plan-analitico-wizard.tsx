"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle } from 'lucide-react'
import { usePlanAnaliticoWizard } from '@/hooks/use-plan-analitico-wizard'
import { Step1Diagnostico } from './step-1-diagnostico'
import { Step2Contextualizacion } from './step-2-contextualizacion'
import { Step3Codiseno } from './step-3-codiseno'
import { useToast } from '@/hooks/use-toast'
import { usePlanAnalitico } from '@/hooks/use-plan-analitico'

interface PlanAnaliticoWizardProps {
    onComplete?: () => void
}

export function PlanAnaliticoWizard({ onComplete }: PlanAnaliticoWizardProps) {
    const {
        currentStep,
        wizardData,
        loading: wizardLoading,
        steps,
        updateWizardData,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        setLoading: setWizardLoading
    } = usePlanAnaliticoWizard()

    const { crearPlanAnalitico, loading: savingLoading } = usePlanAnalitico()
    const { toast } = useToast()

    const loading = wizardLoading || savingLoading

    // Calcular progreso
    const progress = (currentStep / steps.length) * 100

    const handleComplete = async () => {
        const result = await crearPlanAnalitico(wizardData)

        if (result.success) {
            toast({
                title: "¡Plan Analítico guardado!",
                description: "Tu diagnóstico y contextualización se han guardado exitosamente.",
                variant: "default"
            })
            if (onComplete) {
                onComplete()
            }
        } else {
            toast({
                title: "Error",
                description: result.error || "No se pudo guardar el plan analítico.",
                variant: "destructive"
            })
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1Diagnostico
                        data={wizardData}
                        onDataChange={updateWizardData}
                        onNext={goToNextStep}
                        loading={loading}
                        setLoading={setWizardLoading}
                    />
                )
            case 2:
                return (
                    <Step2Contextualizacion
                        data={wizardData}
                        onDataChange={updateWizardData}
                        onNext={goToNextStep}
                        onPrevious={goToPreviousStep}
                        loading={loading}
                    />
                )
            case 3:
                return (
                    <Step3Codiseno
                        data={wizardData}
                        onDataChange={updateWizardData}
                        onPrevious={goToPreviousStep}
                        onComplete={handleComplete}
                        loading={loading}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 w-full px-2 sm:px-0">
            {/* Header */}
            <div className="space-y-4">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Plan Analítico</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Diseña tu estrategia educativa paso a paso
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

            {/* Navegación de pasos */}
            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center w-full sm:w-auto">
                                <button
                                    onClick={() => goToStep(step.id)}
                                    disabled={step.id > currentStep && !step.completed} // Simplificado por ahora
                                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors w-full sm:w-auto ${step.current
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : step.completed
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                            : 'text-gray-400 dark:text-gray-500'
                                        }`}
                                >
                                    {step.completed ? (
                                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                    ) : (
                                        <Circle className="h-5 w-5 flex-shrink-0" />
                                    )}
                                    <div className="text-left min-w-0 flex-1">
                                        <div className="font-medium text-sm sm:text-base">{step.title}</div>
                                        <div className="text-xs opacity-75 hidden sm:block">{step.description}</div>
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

            {/* Contenido del paso actual */}
            <div className="min-h-[400px]">
                {renderStepContent()}
            </div>
        </div>
    )
}
