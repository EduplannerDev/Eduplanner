import { useEffect, useCallback } from 'react'

/**
 * Hook para manejar errores de DOM de manera elegante
 * Intercepta errores comunes de DOM y los maneja silenciosamente
 */
export function useDOMErrorHandler() {
  const handleDOMError = useCallback((error: Error) => {
    const isDOMError = 
      error.message.includes('insertBefore') ||
      error.message.includes('removeChild') ||
      error.message.includes('appendChild')

    if (isDOMError) {
      // Log silencioso del error
      if (typeof window !== 'undefined') {
        import('@/lib/lightweight-logger').then(({ logger }) => {
          logger.error('dom_error_component', `DOM Error en componente: ${error.message}`, {
            errorName: error.name,
            errorType: 'DOM',
            component: 'useDOMErrorHandler',
            silent: true
          })
        }).catch(() => {
          // Fallback silencioso
        })
      }
      
      // Prevenir que el error se propague
      return true
    }
    
    return false
  }, [])

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      if (event.error && handleDOMError(event.error)) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      if (event.reason && handleDOMError(event.reason)) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', unhandledRejectionHandler)

    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
    }
  }, [handleDOMError])

  return { handleDOMError }
}

/**
 * Hook para componentes que manipulan el DOM directamente
 * Proporciona una función wrapper segura para operaciones DOM
 */
export function useSafeDOMOperation() {
  const safeDOMOperation = useCallback(<T>(operation: () => T, fallback?: T): T | undefined => {
    try {
      return operation()
    } catch (error) {
      if (error instanceof Error) {
        const isDOMError = 
          error.message.includes('insertBefore') ||
          error.message.includes('removeChild') ||
          error.message.includes('appendChild')

        if (isDOMError) {
          // Log silencioso
          if (typeof window !== 'undefined') {
            import('@/lib/lightweight-logger').then(({ logger }) => {
              logger.error('dom_operation_error', `Operación DOM fallida: ${error.message}`, {
                errorName: error.name,
                errorType: 'DOM_OPERATION',
                silent: true
              })
            }).catch(() => {
              // Fallback silencioso
            })
          }
          
          return fallback
        }
      }
      
      // Re-lanzar errores que no son de DOM
      throw error
    }
  }, [])

  return { safeDOMOperation }
}
