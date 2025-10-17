/**
 * Hook personalizado para logging de errores en componentes React
 * Proporciona funciones de logging contextualizadas con información del componente
 */

import { useCallback, useRef } from 'react'
import { logError, logReactError, logAuthError, logNetworkError, ErrorContext } from '@/lib/error-logger'

interface UseErrorLoggerOptions {
  componentName?: string
  module?: string
  userId?: string
}

interface ErrorLoggerHook {
  logError: (type: ErrorContext['errorType'], error: Error, context?: Partial<ErrorContext>) => void
  logReactError: (error: Error, errorInfo?: { componentStack?: string }) => void
  logAuthError: (error: Error, context?: Partial<ErrorContext>) => void
  logNetworkError: (error: Error, url?: string, method?: string) => void
  logComponentError: (error: Error, action?: string, additionalContext?: Record<string, any>) => void
  logAsyncError: (error: Error, operation: string, context?: Record<string, any>) => void
}

export function useErrorLogger(options: UseErrorLoggerOptions = {}): ErrorLoggerHook {
  const { componentName, module, userId } = options
  const componentRef = useRef<string>(componentName || 'UnknownComponent')

  // Actualizar el nombre del componente si cambia
  if (componentName && componentName !== componentRef.current) {
    componentRef.current = componentName
  }

  const getBaseContext = useCallback((): Partial<ErrorContext> => {
    return {
      component: componentRef.current,
      module,
      userId,
      timestamp: Date.now()
    }
  }, [module, userId])

  const logErrorWrapper = useCallback((
    type: ErrorContext['errorType'],
    error: Error,
    context?: Partial<ErrorContext>
  ) => {
    const baseContext = getBaseContext()
    logError(type, error, { ...baseContext, ...context })
  }, [getBaseContext])

  const logReactErrorWrapper = useCallback((
    error: Error,
    errorInfo?: { componentStack?: string }
  ) => {
    const baseContext = getBaseContext()
    logReactError(error, {
      componentStack: errorInfo?.componentStack,
      errorBoundary: componentRef.current
    }, componentRef.current)
  }, [getBaseContext])

  const logAuthErrorWrapper = useCallback((
    error: Error,
    context?: Partial<ErrorContext>
  ) => {
    const baseContext = getBaseContext()
    logAuthError(error, { ...baseContext, ...context })
  }, [getBaseContext])

  const logNetworkErrorWrapper = useCallback((
    error: Error,
    url?: string,
    method?: string
  ) => {
    const baseContext = getBaseContext()
    logNetworkError(error, url, method)
  }, [getBaseContext])

  const logComponentError = useCallback((
    error: Error,
    action?: string,
    additionalContext?: Record<string, any>
  ) => {
    const baseContext = getBaseContext()
    logErrorWrapper('react', error, {
      ...baseContext,
      action,
      ...additionalContext
    })
  }, [logErrorWrapper, getBaseContext])

  const logAsyncError = useCallback((
    error: Error,
    operation: string,
    context?: Record<string, any>
  ) => {
    const baseContext = getBaseContext()
    logErrorWrapper('javascript', error, {
      ...baseContext,
      action: operation,
      ...context
    })
  }, [logErrorWrapper, getBaseContext])

  return {
    logError: logErrorWrapper,
    logReactError: logReactErrorWrapper,
    logAuthError: logAuthErrorWrapper,
    logNetworkError: logNetworkErrorWrapper,
    logComponentError,
    logAsyncError
  }
}

/**
 * Hook simplificado para casos comunes
 */
export function useComponentErrorLogger(componentName: string) {
  return useErrorLogger({ componentName })
}

/**
 * Hook para logging de errores de autenticación
 */
export function useAuthErrorLogger(componentName?: string) {
  const logger = useErrorLogger({ componentName, module: 'auth' })
  
  return {
    logAuthError: logger.logAuthError,
    logAuthFailure: (error: Error, action: string) => {
      logger.logAuthError(error, { action })
    },
    logTokenError: (error: Error) => {
      logger.logAuthError(error, { action: 'token_validation' })
    },
    logSessionError: (error: Error) => {
      logger.logAuthError(error, { action: 'session_management' })
    }
  }
}

/**
 * Hook para logging de errores de red/API
 */
export function useNetworkErrorLogger(componentName?: string) {
  const logger = useErrorLogger({ componentName, module: 'network' })
  
  return {
    logNetworkError: logger.logNetworkError,
    logApiError: (error: Error, endpoint: string, method: string = 'GET') => {
      logger.logNetworkError(error, endpoint, method)
    },
    logFetchError: (error: Error, url: string) => {
      logger.logNetworkError(error, url, 'FETCH')
    }
  }
}

/**
 * Hook para logging de errores de formularios
 */
export function useFormErrorLogger(componentName: string, formName?: string) {
  const logger = useErrorLogger({ componentName, module: 'form' })
  
  return {
    logValidationError: (error: Error, field: string) => {
      logger.logComponentError(error, 'validation', { field, formName })
    },
    logSubmitError: (error: Error, formData?: Record<string, any>) => {
      logger.logComponentError(error, 'submit', { formName, formData })
    },
    logFieldError: (error: Error, field: string, value?: any) => {
      logger.logComponentError(error, 'field_error', { field, formName, value })
    }
  }
}

export type { UseErrorLoggerOptions, ErrorLoggerHook }
