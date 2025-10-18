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
      })
    })

    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('javascript', new Error(event.reason), {
        promiseRejection: true,
        reason: event.reason
      })
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
  public logError(
    type: ErrorContext['errorType'],
    error: Error,
    additionalContext?: Partial<ErrorContext> & ReactErrorInfo
  ): void {
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
    
    const context: ErrorContext = {
      errorType: type,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      stack: error.stack,
      // Información extraída del stack
      module: stackInfo.module || additionalContext?.module || 'unknown',
      component: stackInfo.component || additionalContext?.component || 'unknown',
      action: additionalContext?.action || 'unknown',
      ...additionalContext
    }

    // Log usando el sistema ligero con contexto mejorado
    logger.error('error_capture', `${type.toUpperCase()}: ${error.message}`, {
      ...context,
      // Información adicional para debugging
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      filename: stackInfo.filename,
      lineNumber: stackInfo.lineNumber,
      columnNumber: stackInfo.columnNumber
    })

    // Log adicional específico para errores de auth
    if (type === 'auth') {
      logger.error('auth_error', `Auth Error: ${error.message}`, {
        ...context,
        authErrorType: error.name,
        authErrorMessage: error.message,
        authAction: additionalContext?.action || 'unknown'
      })
    }

    // Log adicional a consola en desarrollo
    if (process.env.NODE_ENV === 'development') {
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
  public logReactError(error: Error, errorInfo: ReactErrorInfo, componentName?: string): void {
    this.logError('react', error, {
      component: componentName,
      ...errorInfo
    })
  }

  /**
   * Log específico para errores de autenticación
   */
  public logAuthError(error: Error, context?: Partial<ErrorContext>): void {
    this.logError('auth', error, context)
  }

  /**
   * Log específico para errores de red
   */
  public logNetworkError(error: Error, url?: string, method?: string): void {
    this.logError('network', error, {
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
export const logError = (
  type: ErrorContext['errorType'],
  error: Error,
  context?: Partial<ErrorContext>
) => {
  errorLogger.logError(type, error, context)
}

// Exportar funciones específicas
export const logReactError = (error: Error, errorInfo: ReactErrorInfo, componentName?: string) => {
  errorLogger.logReactError(error, errorInfo, componentName)
}

export const logAuthError = (error: Error, context?: Partial<ErrorContext>) => {
  errorLogger.logAuthError(error, context)
}

export const logNetworkError = (error: Error, url?: string, method?: string) => {
  errorLogger.logNetworkError(error, url, method)
}

export type { ErrorContext, ReactErrorInfo }
