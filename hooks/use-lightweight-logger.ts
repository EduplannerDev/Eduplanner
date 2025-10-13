/**
 * Hook ultra-optimizado para logging en React
 * - Sin re-renders innecesarios
 * - Debouncing automático
 * - Cache inteligente
 * - Mínimo overhead
 */

import { useCallback, useRef, useMemo } from 'react'
import { logger } from '@/lib/lightweight-logger'

interface LogContext {
  component?: string
  action?: string
  userId?: string
  plantelId?: string
  [key: string]: any
}

export function useLightweightLogger() {
  // Cache de contextos para evitar recreación
  const contextCache = useRef<Map<string, LogContext>>(new Map())
  
  // Debouncing para evitar logs excesivos
  const debounceMap = useRef<Map<string, NodeJS.Timeout>>(new Map())

  /**
   * Crear contexto optimizado (memoizado)
   */
  const createContext = useCallback((baseContext?: LogContext): LogContext => {
    const cacheKey = JSON.stringify(baseContext || {})
    
    if (contextCache.current.has(cacheKey)) {
      return contextCache.current.get(cacheKey)!
    }

    const context: LogContext = {
      component: baseContext?.component,
      action: baseContext?.action,
      userId: baseContext?.userId,
      plantelId: baseContext?.plantelId,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent.substring(0, 100) : undefined,
      ...baseContext
    }

    // Limitar cache a 50 entradas
    if (contextCache.current.size >= 50) {
      const firstKey = contextCache.current.keys().next().value
      contextCache.current.delete(firstKey)
    }

    contextCache.current.set(cacheKey, context)
    return context
  }, [])

  /**
   * Log con debouncing para acciones repetitivas
   */
  const logWithDebounce = useCallback((
    level: 'INFO' | 'WARN' | 'ERROR',
    category: string,
    message: string,
    context?: LogContext,
    debounceMs: number = 1000
  ) => {
    const debounceKey = `${category}:${message}`
    
    // Limpiar timeout anterior
    const existingTimeout = debounceMap.current.get(debounceKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Crear nuevo timeout
    const timeout = setTimeout(() => {
      logger.log(level, category, message, createContext(context))
      debounceMap.current.delete(debounceKey)
    }, debounceMs)

    debounceMap.current.set(debounceKey, timeout)
  }, [createContext])

  /**
   * Log inmediato (para errores críticos)
   */
  const logImmediate = useCallback((
    level: 'ERROR' | 'FATAL',
    category: string,
    message: string,
    context?: LogContext
  ) => {
    logger.log(level, category, message, createContext(context))
  }, [createContext])

  /**
   * Métodos específicos optimizados
   */
  const logUserAction = useCallback((
    action: string,
    context?: LogContext
  ) => {
    // Solo log acciones importantes (sampling)
    const importantActions = [
      'login', 'logout', 'create_planeacion', 'create_examen',
      'payment_success', 'payment_failed', 'subscription_change'
    ]

    if (importantActions.includes(action) || Math.random() < 0.1) {
      logWithDebounce('INFO', 'user_action', `User action: ${action}`, context)
    }
  }, [logWithDebounce])

  const logPerformance = useCallback((
    metricName: string,
    value: number,
    context?: LogContext
  ) => {
    // Solo log métricas importantes
    if (value > 1000 || Math.random() < 0.05) { // Solo si es lento o 5% sampling
      logger.log('INFO', 'performance', `${metricName}: ${value}ms`, {
        ...createContext(context),
        metricValue: value
      })
    }
  }, [createContext])

  const logError = useCallback((
    error: Error,
    context?: LogContext
  ) => {
    // Siempre log errores (sin debouncing)
    logImmediate('ERROR', 'frontend_error', error.message, {
      ...createContext(context),
      errorName: error.name,
      errorStack: error.stack?.substring(0, 500) // Limitar stack trace
    })
  }, [logImmediate, createContext])

  const logApiCall = useCallback((
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext
  ) => {
    const category = statusCode >= 400 ? 'api_error' : 'api_call'
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO'

    logger.log(level, category, `${method} ${endpoint} - ${statusCode}`, {
      ...createContext(context),
      endpoint,
      method,
      statusCode,
      responseTime
    })
  }, [createContext])

  /**
   * Hook para medir rendimiento de componentes
   */
  const usePerformanceTracker = useCallback((componentName: string) => {
    const startTime = useRef<number>(0)

    const startTracking = useCallback(() => {
      startTime.current = performance.now()
    }, [])

    const endTracking = useCallback((action?: string) => {
      if (startTime.current > 0) {
        const duration = performance.now() - startTime.current
        logPerformance(`${componentName}${action ? `_${action}` : ''}`, duration, {
          component: componentName,
          action
        })
        startTime.current = 0
      }
    }, [componentName, logPerformance])

    return { startTracking, endTracking }
  }, [logPerformance])

  /**
   * Métodos memoizados para evitar recreación
   */
  const methods = useMemo(() => ({
    // Logs básicos
    info: (category: string, message: string, context?: LogContext) => 
      logWithDebounce('INFO', category, message, context),
    warn: (category: string, message: string, context?: LogContext) => 
      logWithDebounce('WARN', category, message, context),
    error: (category: string, message: string, context?: LogContext) => 
      logImmediate('ERROR', category, message, context),
    
    // Logs específicos
    userAction: logUserAction,
    performance: logPerformance,
    error: logError,
    apiCall: logApiCall,
    
    // Utilidades
    usePerformanceTracker,
    createContext
  }), [
    logWithDebounce,
    logImmediate,
    logUserAction,
    logPerformance,
    logError,
    logApiCall,
    usePerformanceTracker,
    createContext
  ])

  return methods
}

// Hook simplificado para casos básicos
export function useSimpleLogger() {
  const log = useCallback((message: string, context?: LogContext) => {
    logger.info('component', message, context)
  }, [])

  const logError = useCallback((error: Error, context?: LogContext) => {
    logger.error('component_error', error.message, {
      ...context,
      errorName: error.name,
      errorStack: error.stack?.substring(0, 200)
    })
  }, [])

  return { log, logError }
}
