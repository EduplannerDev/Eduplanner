"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRoles } from "@/hooks/use-roles"
import { hasUserSeenWelcomeModal, markWelcomeModalAsSeen, resetUserWelcomeModal } from "@/lib/welcome-modal"

export function useWelcomeModal(options: { autoShow?: boolean } = { autoShow: true }) {
  const [showModal, setShowModal] = useState(false)
  const [hasSeen, setHasSeen] = useState(true) // Default to true to avoid flash
  const [isLoading, setIsLoading] = useState(true)
  const { user, loading } = useAuth()
  const { isAdmin, loading: loadingRoles } = useRoles()

  useEffect(() => {
    const checkModalStatus = async () => {
      // Solo ejecutar después de que la autenticación y roles se hayan cargado
      if (loading || loadingRoles) return

      // Solo verificar si el usuario está autenticado
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Verificar si el usuario ya ha visto el modal
        const userHasSeen = await hasUserSeenWelcomeModal()

        // Si es admin, forzamos hasSeen a false para que siempre vea la tarjeta (para pruebas)
        // Ojo: esto hará que la tarjeta aparezca siempre para admins, incluso si la descartan
        const effectiveHasSeen = isAdmin ? false : userHasSeen

        setHasSeen(effectiveHasSeen)

        if (!effectiveHasSeen && options.autoShow) {
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
  }, [user, loading, loadingRoles, isAdmin, options.autoShow])

  const closeModal = async () => {
    setShowModal(false)

    // Marcar el modal como visto en la base de datos
    try {
      await markWelcomeModalAsSeen()
      setHasSeen(true) // Actualizar estado local para ocultar la tarjeta inmediatamente
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
    setShowModal, // Expose setter for manual control
    closeModal,
    resetWelcomeModal,
    isLoading,
    hasSeen,
  }
}
