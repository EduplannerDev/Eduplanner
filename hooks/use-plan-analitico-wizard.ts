"use client"

import { useState, useEffect } from 'react'
import { PlanAnaliticoFormData, WizardStep, Problematica, NuevoPDA } from '@/types/plan-analitico'

const INITIAL_DATA: PlanAnaliticoFormData = {
    grupo_id: '',
    ciclo_escolar: '2025-2026', // Default o dinámico
    input_comunitario: '',
    input_escolar: '',
    input_grupo: '',
    diagnostico_generado: '',
    problematicas: [],
    nuevos_pdas: []
}

const STEPS: WizardStep[] = [
    {
        id: 1,
        title: 'Lectura de la Realidad',
        description: 'Diagnóstico socioeducativo',
        current: true,
        completed: false
    },
    {
        id: 2,
        title: 'Contextualización',
        description: 'Problemáticas y PDAs',
        current: false,
        completed: false
    },
    {
        id: 3,
        title: 'Codiseño',
        description: 'Contenidos locales',
        current: false,
        completed: false
    }
]

export function usePlanAnaliticoWizard() {
    const [currentStep, setCurrentStep] = useState(1)
    const [wizardData, setWizardData] = useState<PlanAnaliticoFormData>(INITIAL_DATA)
    const [loading, setLoading] = useState(false)
    const [steps, setSteps] = useState<WizardStep[]>(STEPS)

    // Actualizar estado de los pasos
    useEffect(() => {
        setSteps(prevSteps => prevSteps.map(step => ({
            ...step,
            current: step.id === currentStep,
            completed: step.id < currentStep
        })))
    }, [currentStep])

    const updateWizardData = (data: Partial<PlanAnaliticoFormData>) => {
        setWizardData(prev => ({ ...prev, ...data }))
    }

    const addProblematica = (problematica: Problematica) => {
        setWizardData(prev => ({
            ...prev,
            problematicas: [...prev.problematicas, problematica]
        }))
    }

    const updateProblematica = (id: string, data: Partial<Problematica>) => {
        setWizardData(prev => ({
            ...prev,
            problematicas: prev.problematicas.map(p => p.id === id ? { ...p, ...data } : p)
        }))
    }

    const removeProblematica = (id: string) => {
        setWizardData(prev => ({
            ...prev,
            problematicas: prev.problematicas.filter(p => p.id !== id)
        }))
    }

    const addNuevoPDA = (pda: NuevoPDA) => {
        setWizardData(prev => ({
            ...prev,
            nuevos_pdas: [...prev.nuevos_pdas, pda]
        }))
    }

    const removeNuevoPDA = (id: string) => {
        setWizardData(prev => ({
            ...prev,
            nuevos_pdas: prev.nuevos_pdas.filter(p => p.id !== id)
        }))
    }

    const goToNextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const goToStep = (step: number) => {
        if (step >= 1 && step <= STEPS.length) {
            setCurrentStep(step)
        }
    }

    const resetWizard = () => {
        setWizardData(INITIAL_DATA)
        setCurrentStep(1)
    }

    return {
        currentStep,
        wizardData,
        loading,
        steps,
        setLoading,
        updateWizardData,
        addProblematica,
        updateProblematica,
        removeProblematica,
        addNuevoPDA,
        removeNuevoPDA,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        resetWizard
    }
}
