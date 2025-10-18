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
  logError: (type: ErrorContext['errorType'], error: Error, context?: Partial<ErrorContext>) => Promise<void>
  logReactError: (error: Error, errorInfo?: { componentStack?: string }) => Promise<void>
  logAuthError: (error: Error, context?: Partial<ErrorContext>) => Promise<void>
  logNetworkError: (error: Error, url?: string, method?: string) => Promise<void>
  logComponentError: (error: Error, action?: string, additionalContext?: Record<string, any>) => Promise<void>
  logAsyncError: (error: Error, operation: string, context?: Record<string, any>) => Promise<void>
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

  const logErrorWrapper = useCallback(async (
    type: ErrorContext['errorType'],
    error: Error,
    context?: Partial<ErrorContext>
  ) => {
    const baseContext = getBaseContext()
    await logError(type, error, { ...baseContext, ...context })
  }, [getBaseContext])

  const logReactErrorWrapper = useCallback(async (
    error: Error,
    errorInfo?: { componentStack?: string }
  ) => {
    const baseContext = getBaseContext()
    await logReactError(error, {
      componentStack: errorInfo?.componentStack,
      errorBoundary: componentRef.current
    }, componentRef.current)
  }, [getBaseContext])

  const logAuthErrorWrapper = useCallback(async (
    error: Error,
    context?: Partial<ErrorContext>
  ) => {
    const baseContext = getBaseContext()
    await logAuthError(error, { ...baseContext, ...context })
  }, [getBaseContext])

  const logNetworkErrorWrapper = useCallback(async (
    error: Error,
    url?: string,
    method?: string
  ) => {
    const baseContext = getBaseContext()
    await logNetworkError(error, url, method)
  }, [getBaseContext])

  const logComponentError = useCallback(async (
    error: Error,
    action?: string,
    additionalContext?: Record<string, any>
  ) => {
    const baseContext = getBaseContext()
    await logErrorWrapper('react', error, {
      ...baseContext,
      action,
      ...additionalContext
    })
  }, [logErrorWrapper, getBaseContext])

  const logAsyncError = useCallback(async (
    error: Error,
    operation: string,
    context?: Record<string, any>
  ) => {
    const baseContext = getBaseContext()
    await logErrorWrapper('javascript', error, {
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
    logAuthFailure: async (error: Error, action: string) => {
      await logger.logAuthError(error, { action })
    },
    logTokenError: async (error: Error) => {
      await logger.logAuthError(error, { action: 'token_validation' })
    },
    logSessionError: async (error: Error) => {
      await logger.logAuthError(error, { action: 'session_management' })
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
    logApiError: async (error: Error, endpoint: string, method: string = 'GET') => {
      await logger.logNetworkError(error, endpoint, method)
    },
    logFetchError: async (error: Error, url: string) => {
      await logger.logNetworkError(error, url, 'FETCH')
    }
  }
}

/**
 * Hook para logging de errores de formularios
 */
export function useFormErrorLogger(componentName: string, formName?: string) {
  const logger = useErrorLogger({ componentName, module: 'form' })
  
  return {
    logValidationError: async (error: Error, field: string) => {
      await logger.logComponentError(error, 'validation', { field, formName })
    },
    logSubmitError: async (error: Error, formData?: Record<string, any>) => {
      await logger.logComponentError(error, 'submit', { formName, formData })
    },
    logFieldError: async (error: Error, field: string, value?: any) => {
      await logger.logComponentError(error, 'field_error', { field, formName, value })
    }
  }
}

export type { UseErrorLoggerOptions, ErrorLoggerHook }
