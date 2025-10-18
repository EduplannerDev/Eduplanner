/**
 * Sistema mejorado de logging de errores con contexto detallado
 * Captura errores globales, de React, DOM y proporciona información contextual
 */

import { logger } from './lightweight-logger'

interface ErrorContext {
  module?: string
  component?: string
  action?: string
  userId?: string
  userEmail?: string
  userRole?: string
  sessionId?: string
  url?: string
  userAgent?: string
  timestamp: number
  stack?: string
  errorType: 'react' | 'dom' | 'javascript' | 'auth' | 'network' | 'unknown'
}

interface ReactErrorInfo {
  componentStack?: string
  errorBoundary?: string
}

class ErrorLogger {
  private errorCounts: Map<string, number> = new Map()
  private readonly maxErrorsPerType = 50 // Aumentar límite para evitar perder errores importantes
  private readonly maxAuthErrors = 100 // Límite especial para errores de auth

  constructor() {
    this.setupGlobalErrorHandlers()
  }

  /**
   * Obtener información del usuario actual
   */
  private async getUserInfo(): Promise<{userId?: string, userEmail?: string, userRole?: string}> {
    try {
      // Intentar obtener información del usuario desde localStorage o sessionStorage
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        return {
          userId: user.id || user.user_id,
          userEmail: user.email,
          userRole: user.role || user.user_role
        }
      }

      // Intentar obtener desde Supabase si está disponible
      if (typeof window !== 'undefined' && window.supabase) {
        const { data: { user } } = await window.supabase.auth.getUser()
        if (user) {
          return {
            userId: user.id,
            userEmail: user.email,
            userRole: user.user_metadata?.role || user.app_metadata?.role
          }
        }
      }

      return {}
    } catch (error) {
      // Silenciar errores al obtener información del usuario
      return {}
    }
  }

  /**
   * Configurar captura global de errores
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // Capturar errores de JavaScript no manejados
    window.addEventListener('error', (event) => {
      this.logError('javascript', event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message
      }).catch(() => {}) // Silenciar errores de logging
    })

    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('javascript', new Error(event.reason), {
        promiseRejection: true,
        reason: event.reason
      }).catch(() => {}) // Silenciar errores de logging
    })

    // Capturar errores específicos de DOM
    this.setupDOMErrorHandlers()
  }

  /**
   * Configurar captura específica de errores de DOM
   */
  private setupDOMErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // Interceptar errores comunes de DOM
    const originalInsertBefore = Node.prototype.insertBefore
    const originalAppendChild = Node.prototype.appendChild
    const originalRemoveChild = Node.prototype.removeChild

    Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null) {
      try {
        return originalInsertBefore.call(this, newNode, referenceNode)
      } catch (error) {
        ErrorLogger.getInstance().logError('dom', error as Error, {
          operation: 'insertBefore',
          newNodeType: newNode.nodeType,
          newNodeName: newNode.nodeName,
          referenceNodeType: referenceNode?.nodeType,
          referenceNodeName: referenceNode?.nodeName,
          parentNodeType: this.nodeType,
          parentNodeName: this.nodeName,
          parentNodeId: (this as Element).id || undefined,
          parentNodeClass: (this as Element).className || undefined
        })
        throw error
      }
    }

    Node.prototype.appendChild = function(newNode: Node) {
      try {
        return originalAppendChild.call(this, newNode)
      } catch (error) {
        ErrorLogger.getInstance().logError('dom', error as Error, {
          operation: 'appendChild',
          newNodeType: newNode.nodeType,
          newNodeName: newNode.nodeName,
          parentNodeType: this.nodeType,
          parentNodeName: this.nodeName,
          parentNodeId: (this as Element).id || undefined,
          parentNodeClass: (this as Element).className || undefined
        })
        throw error
      }
    }

    Node.prototype.removeChild = function(oldNode: Node) {
      try {
        return originalRemoveChild.call(this, oldNode)
      } catch (error) {
        ErrorLogger.getInstance().logError('dom', error as Error, {
          operation: 'removeChild',
          oldNodeType: oldNode.nodeType,
          oldNodeName: oldNode.nodeName,
          parentNodeType: this.nodeType,
          parentNodeName: this.nodeName,
          parentNodeId: (this as Element).id || undefined,
          parentNodeClass: (this as Element).className || undefined
        })
        throw error
      }
    }
  }

  /**
   * Log principal de errores con contexto detallado
   */
  public async logError(
    type: ErrorContext['errorType'],
    error: Error,
    additionalContext?: Partial<ErrorContext> & ReactErrorInfo
  ): Promise<void> {
    const errorKey = `${type}:${error.message}`
    const count = this.errorCounts.get(errorKey) || 0

    // Usar límites diferentes según el tipo de error
    const maxErrors = type === 'auth' ? this.maxAuthErrors : this.maxErrorsPerType

    // Evitar spam de errores repetidos
    if (count >= maxErrors) {
      return
    }

    this.errorCounts.set(errorKey, count + 1)

    // Extraer información detallada del stack trace
    const stackInfo = this.extractDetailedStackInfo(error.stack)
    
    // Obtener información del usuario
    const userInfo = await this.getUserInfo()
    
    const context: ErrorContext = {
      errorType: type,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      stack: error.stack,
      ...userInfo, // Incluir información del usuario
      // Información extraída del stack
      module: stackInfo.module || additionalContext?.module || 'unknown',
      component: stackInfo.component || additionalContext?.component || 'unknown',
      action: additionalContext?.action || 'unknown',
      ...additionalContext
    }

    // Log usando el sistema ligero con contexto mejorado
    try {
      logger.error('error_capture', `${type.toUpperCase()}: ${error.message}`, {
        ...context,
        // Información adicional para debugging
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        filename: stackInfo.filename,
        lineNumber: stackInfo.lineNumber,
        columnNumber: stackInfo.columnNumber,
        // Asegurar que el módulo se capture
        module: context.module,
        component: context.component,
        action: context.action
      })

      // Log adicional específico para errores de auth
      if (type === 'auth') {
        logger.error('auth_error', `Auth Error: ${error.message}`, {
          ...context,
          authErrorType: error.name,
          authErrorMessage: error.message,
          authAction: additionalContext?.action || 'unknown',
          // Asegurar que el módulo se capture
          module: context.module,
          component: context.component,
          action: context.action
        })
      }
    } catch (loggingError) {
      // Fallback crítico: si el logging falla, intentar enviar directamente a la API
      try {
        // Enviar directamente a la API sin pasar por el logger
        fetch('/api/logs/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logs: [{
              level: 'ERROR',
              category: 'error_logger_fallback',
              message: `CRITICAL: Error logging system failed - ${error.message}`,
              context: { type, errorMessage: error.message, stack: error.stack },
              timestamp: Date.now()
            }]
          })
        }).catch(() => {
          // Si incluso esto falla, no hacer nada para no molestar al usuario
        });
      } catch {
        // Silencioso - no molestar al usuario
      }
    }

    // Log adicional a consola SOLO en desarrollo del servidor (no en el navegador)
    if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
      console.group(`🚨 Error Captured: ${type.toUpperCase()}`)
      console.error('Error:', error)
      console.log('Context:', context)
      console.log('Module:', context.module)
      console.log('Component:', context.component)
      console.log('Action:', context.action)
      console.log('Stack Info:', stackInfo)
      console.groupEnd()
    }
  }

  /**
   * Extraer información detallada del stack trace
   */
  private extractDetailedStackInfo(stack?: string): {
    module: string | null
    component: string | null
    filename: string | null
    lineNumber: number | null
    columnNumber: number | null
  } {
    if (!stack) {
      return {
        module: null,
        component: null,
        filename: null,
        lineNumber: null,
        columnNumber: null
      }
    }

    const lines = stack.split('\n')
    
    for (const line of lines) {
      // Buscar patrones como: at ComponentName (file.tsx:line:column)
      const componentMatch = line.match(/at\s+(\w+)\s+\([^)]*\/components\/[^)]*\)/)
      if (componentMatch) {
        return {
          module: 'components',
          component: componentMatch[1],
          filename: this.extractFilename(line),
          lineNumber: this.extractLineNumber(line),
          columnNumber: this.extractColumnNumber(line)
        }
      }

      // Buscar en hooks
      const hookMatch = line.match(/at\s+(\w+)\s+\([^)]*\/hooks\/[^)]*\)/)
      if (hookMatch) {
        return {
          module: 'hooks',
          component: hookMatch[1],
          filename: this.extractFilename(line),
          lineNumber: this.extractLineNumber(line),
          columnNumber: this.extractColumnNumber(line)
        }
      }

      // Buscar en lib
      const libMatch = line.match(/at\s+(\w+)\s+\([^)]*\/lib\/[^)]*\)/)
      if (libMatch) {
        return {
          module: 'lib',
          component: libMatch[1],
          filename: this.extractFilename(line),
          lineNumber: this.extractLineNumber(line),
          columnNumber: this.extractColumnNumber(line)
        }
      }

      // Buscar en app
      const appMatch = line.match(/at\s+(\w+)\s+\([^)]*\/app\/[^)]*\)/)
      if (appMatch) {
        return {
          module: 'app',
          component: appMatch[1],
          filename: this.extractFilename(line),
          lineNumber: this.extractLineNumber(line),
          columnNumber: this.extractColumnNumber(line)
        }
      }

      // Buscar cualquier función/método
      const functionMatch = line.match(/at\s+(\w+)\s+\(/)
      if (functionMatch) {
        return {
          module: 'unknown',
          component: functionMatch[1],
          filename: this.extractFilename(line),
          lineNumber: this.extractLineNumber(line),
          columnNumber: this.extractColumnNumber(line)
        }
      }
    }

    return {
      module: null,
      component: null,
      filename: null,
      lineNumber: null,
      columnNumber: null
    }
  }

  private extractFilename(line: string): string | null {
    const match = line.match(/\/([^/]+\.(tsx?|jsx?))/)
    return match ? match[1] : null
  }

  private extractLineNumber(line: string): number | null {
    const match = line.match(/:(\d+):/)
    return match ? parseInt(match[1]) : null
  }

  private extractColumnNumber(line: string): number | null {
    const match = line.match(/:\d+:(\d+)/)
    return match ? parseInt(match[1]) : null
  }

  /**
   * Extraer el módulo/componente del stack trace (método legacy)
   */
  private extractModuleFromStack(stack?: string): string | null {
    if (!stack) return null

    const lines = stack.split('\n')
    
    // Buscar líneas que contengan rutas de archivos de la aplicación
    for (const line of lines) {
      // Buscar patrones como: at ComponentName (file.tsx:line:column)
      const match = line.match(/at\s+(\w+)\s+\([^)]*\/app\/[^)]*\)|at\s+(\w+)\s+\([^)]*\/components\/[^)]*\)|at\s+(\w+)\s+\([^)]*\/hooks\/[^)]*\)|at\s+(\w+)\s+\([^)]*\/lib\/[^)]*\)/)
      if (match) {
        return match[1] || match[2] || match[3] || match[4]
      }

      // Buscar archivos específicos de la aplicación
      const fileMatch = line.match(/\/(app|components|hooks|lib)\/[^:]+\.(tsx?|jsx?)/)
      if (fileMatch) {
        const fileName = fileMatch[0].split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '')
        if (fileName) {
          return fileName
        }
      }
    }

    return null
  }

  /**
   * Log específico para errores de React
   */
  public async logReactError(error: Error, errorInfo: ReactErrorInfo, componentName?: string): Promise<void> {
    await this.logError('react', error, {
      component: componentName,
      ...errorInfo
    })
  }

  /**
   * Log específico para errores de autenticación
   */
  public async logAuthError(error: Error, context?: Partial<ErrorContext>): Promise<void> {
    await this.logError('auth', error, context)
  }

  /**
   * Log específico para errores de red
   */
  public async logNetworkError(error: Error, url?: string, method?: string): Promise<void> {
    await this.logError('network', error, {
      url,
      action: method
    })
  }

  /**
   * Singleton instance
   */
  private static instance: ErrorLogger | null = null

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Resetear contadores de errores (útil para testing)
   */
  public resetErrorCounts(): void {
    this.errorCounts.clear()
  }
}

// Exportar instancia singleton
export const errorLogger = ErrorLogger.getInstance()

// Exportar función de conveniencia para uso en componentes
export const logError = async (
  type: ErrorContext['errorType'],
  error: Error,
  context?: Partial<ErrorContext>
) => {
  await errorLogger.logError(type, error, context)
}

// Exportar funciones específicas
export const logReactError = async (error: Error, errorInfo: ReactErrorInfo, componentName?: string) => {
  await errorLogger.logReactError(error, errorInfo, componentName)
}

export const logAuthError = async (error: Error, context?: Partial<ErrorContext>) => {
  await errorLogger.logAuthError(error, context)
}

export const logNetworkError = async (error: Error, url?: string, method?: string) => {
  await errorLogger.logNetworkError(error, url, method)
}

export type { ErrorContext, ReactErrorInfo }
export { ErrorLogger }
