/**
 * Hook personalizado para manejar scroll de manera segura
 * Evita conflictos con React DOM
 */

import { useRef, useCallback } from 'react'

export function useSafeScroll() {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToElement = useCallback((element: HTMLElement | null, options?: ScrollIntoViewOptions) => {
    if (!element) return

    // Cancelar scroll anterior si existe
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Usar requestAnimationFrame para asegurar que el DOM esté estable
    requestAnimationFrame(() => {
      scrollTimeoutRef.current = setTimeout(() => {
        try {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest',
            ...options
          })
        } catch (error) {
          // Si falla el scroll suave, intentar scroll instantáneo
          console.warn('Smooth scroll failed, using instant scroll:', error)
          try {
            element.scrollIntoView({
              behavior: 'instant',
              block: 'end',
              inline: 'nearest'
            })
          } catch (instantError) {
            console.error('Scroll failed completely:', instantError)
          }
        }
      }, 50) // Pequeño delay para evitar conflictos
    })
  }, [])

  const scrollToBottom = useCallback((container: HTMLElement | null) => {
    if (!container) return

    // Cancelar scroll anterior si existe
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    requestAnimationFrame(() => {
      scrollTimeoutRef.current = setTimeout(() => {
        try {
          container.scrollTop = container.scrollHeight
        } catch (error) {
          console.error('Scroll to bottom failed:', error)
        }
      }, 50)
    })
  }, [])

  // Cleanup al desmontar
  const cleanup = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  return {
    scrollToElement,
    scrollToBottom,
    cleanup
  }
}
