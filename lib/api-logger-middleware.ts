/**
 * Middleware ultra-optimizado para logging de API routes
 * - Mínimo overhead
 * - Sampling inteligente
 * - Sin bloqueo
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './lightweight-logger'

interface ApiLogContext {
  method: string
  url: string
  userAgent?: string
  ipAddress?: string
  responseTime: number
  statusCode: number
  userId?: string
  plantelId?: string
  requestSize?: number
  responseSize?: number
}

/**
 * Middleware que envuelve handlers de API con logging mínimo
 */
export function withApiLogger(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    sampleRate?: number
    logSlowRequests?: boolean
    slowThreshold?: number
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now()
    const sampleRate = options?.sampleRate ?? 0.1 // 10% por defecto
    const slowThreshold = options?.slowThreshold ?? 2000 // 2 segundos

    // Sampling: solo log un porcentaje de requests
    const shouldLog = Math.random() < sampleRate

    let context: Partial<ApiLogContext> = {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || undefined
    }

    try {
      // Ejecutar handler original
      const response = await handler(req)

      const responseTime = Math.round(performance.now() - startTime)
      const statusCode = response.status

      context = {
        ...context,
        responseTime,
        statusCode
      }

      // Log basado en condiciones
      if (shouldLog || statusCode >= 400 || responseTime > slowThreshold) {
        const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO'
        const category = statusCode >= 400 ? 'api_error' : 'api_success'

        logger.log(level, category, `${req.method} ${req.url}`, context)
      }

      return response

    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime)
      
      // Siempre log errores
      logger.error('api_error', `${req.method} ${req.url} - ${error instanceof Error ? error.message : 'Unknown error'}`, {
        ...context,
        responseTime,
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Re-lanzar error para que Next.js lo maneje
      throw error
    }
  }
}

/**
 * Función helper para logging manual en API routes
 */
export function logApiEvent(
  req: NextRequest,
  event: string,
  context?: Record<string, any>
) {
  logger.info('api_event', event, {
    method: req.method,
    url: req.url,
    ...context
  })
}

/**
 * Middleware específico para rutas de alta frecuencia (como logs)
 */
export function withMinimalLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now()

    try {
      const response = await handler(req)
      
      // Solo log errores en rutas de alta frecuencia
      if (response.status >= 400) {
        const responseTime = Math.round(performance.now() - startTime)
        logger.warn('api_minimal', `${req.method} ${req.url} - ${response.status}`, {
          method: req.method,
          url: req.url,
          statusCode: response.status,
          responseTime
        })
      }

      return response
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime)
      logger.error('api_minimal_error', `${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}

/**
 * Función para medir tiempo de ejecución de funciones
 */
export function measureExecutionTime<T>(
  fn: () => T | Promise<T>,
  context: string
): Promise<T> {
  const startTime = performance.now()
  
  return Promise.resolve(fn()).then(
    (result) => {
      const duration = Math.round(performance.now() - startTime)
      if (duration > 100) { // Solo log si toma más de 100ms
        logger.info('execution_time', `${context}: ${duration}ms`)
      }
      return result
    },
    (error) => {
      const duration = Math.round(performance.now() - startTime)
      logger.error('execution_error', `${context} failed after ${duration}ms`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  )
}
