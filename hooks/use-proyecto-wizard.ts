"use client"

import { useState, useCallback } from 'react'
import { ProyectoWizardData, ProyectoFormData } from '@/types/proyectos'

export function useProyectoWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<ProyectoWizardData>({
    nombre: '',
    problematica: '',
    producto_final: '',
    grupo_id: '',
    metodologia_nem: '',
    pdas_seleccionados: [],
    fases_generadas: []
  })
  const [loading, setLoading] = useState(false)

  // Definir los pasos del asistente
  const steps = [
    {
      id: 1,
      title: 'Define tu Proyecto',
      description: 'Información básica del proyecto',
      completed: false,
      current: currentStep === 1
    },
    {
      id: 2,
      title: 'Selecciona PDAs',
      description: 'Elige los contenidos curriculares',
      completed: false,
      current: currentStep === 2
    },
    {
      id: 3,
      title: 'Generar Contenido',
      description: 'IA genera las fases del proyecto',
      completed: false,
      current: currentStep === 3
    }
  ]

  // Actualizar datos del paso 1
  const updateStep1Data = useCallback((data: ProyectoFormData) => {
    setWizardData(prev => ({
      ...prev,
      nombre: data.nombre,
      problematica: data.problematica,
      producto_final: data.producto_final,
      grupo_id: data.grupo_id,
      metodologia_nem: data.metodologia_nem
    }))
  }, [])

  // Actualizar PDAs seleccionados
  const updateSelectedPdas = useCallback((pdas: string[]) => {
    setWizardData(prev => ({
      ...prev,
      pdas_seleccionados: pdas
    }))
  }, [])

  // Ir al siguiente paso
  const goToNextStep = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
      // Marcar el paso actual como completado
      setWizardData(prev => ({
        ...prev,
        // Aquí podrías agregar lógica para marcar pasos como completados
      }))
    }
  }, [currentStep])

  // Ir al paso anterior
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Ir a un paso específico
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step)
    }
  }, [])

  // Resetear el asistente
  const resetWizard = useCallback(() => {
    setCurrentStep(1)
    setWizardData({
      nombre: '',
      problematica: '',
      producto_final: '',
      grupo_id: '',
      metodologia_nem: '',
      pdas_seleccionados: [],
      fases_generadas: []
    })
    setLoading(false)
  }, [])

  // Verificar si un paso está completado
  const isStepCompleted = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!(wizardData.nombre && wizardData.problematica && 
                 wizardData.producto_final && wizardData.grupo_id && 
                 wizardData.metodologia_nem)
      case 2:
        return wizardData.pdas_seleccionados.length > 0
      case 3:
        return wizardData.fases_generadas.length > 0
      default:
        return false
    }
  }, [wizardData])

  // Obtener datos del formulario del paso 1
  const getStep1FormData = useCallback((): ProyectoFormData => {
    return {
      nombre: wizardData.nombre,
      problematica: wizardData.problematica,
      producto_final: wizardData.producto_final,
      grupo_id: wizardData.grupo_id,
      metodologia_nem: wizardData.metodologia_nem
    }
  }, [wizardData])

  return {
    // Estado
    currentStep,
    wizardData,
    loading,
    steps,
    
    // Acciones
    updateStep1Data,
    updateSelectedPdas,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetWizard,
    setLoading,
    
    // Utilidades
    isStepCompleted,
    getStep1FormData,
    
    // Estado computado
    canGoNext: currentStep < 3,
    canGoPrevious: currentStep > 1,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === 3
  }
}
