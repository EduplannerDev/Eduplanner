"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { hasUserSeenWelcomeModal, markWelcomeModalAsSeen, resetUserWelcomeModal } from "@/lib/welcome-modal"

export function useWelcomeModal() {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user, loading } = useAuth()

  useEffect(() => {
    const checkModalStatus = async () => {
      // Solo ejecutar después de que la autenticación se haya cargado
      if (loading) return

      // Solo verificar si el usuario está autenticado
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Verificar si el usuario ya ha visto el modal
        const hasSeen = await hasUserSeenWelcomeModal()
        
        if (!hasSeen) {
          // Esperar un poco para que la interfaz se estabilice
          const timer = setTimeout(() => {
            setShowModal(true)
            setIsLoading(false)
          }, 1000)

          return () => clearTimeout(timer)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error verificando estado del modal:', error)
        setIsLoading(false)
      }
    }

    checkModalStatus()
  }, [user, loading])

  const closeModal = async () => {
    setShowModal(false)
    
    // Marcar el modal como visto en la base de datos
    try {
      await markWelcomeModalAsSeen()
    } catch (error) {
      console.error('Error marcando modal como visto:', error)
    }
  }

  const resetWelcomeModal = async () => {
    try {
      const success = await resetUserWelcomeModal()
      if (success) {
        setShowModal(false)
        // Mostrar el modal inmediatamente después del reset
        setTimeout(() => setShowModal(true), 500)
      } else {
        console.error('No se pudo resetear el modal')
      }
    } catch (error) {
      console.error('Error reseteando modal:', error)
    }
  }

  return {
    showModal,
    closeModal,
    resetWelcomeModal,
    isLoading,
  }
}
