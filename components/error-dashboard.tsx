"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, Eye, RefreshCw, X } from 'lucide-react'
import { errorLogger } from '@/lib/error-logger'

interface ErrorLog {
  id: string
  level: 'ERROR' | 'FATAL'
  category: string
  message: string
  context?: Record<string, any>
  timestamp: number
  resolved: boolean
}

interface ErrorDashboardProps {
  onClose?: () => void
}

export function ErrorDashboard({ onClose }: ErrorDashboardProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de errores desde el sistema de logging
    loadErrors()
  }, [])

  const loadErrors = async () => {
    setLoading(true)
    try {
      // En un sistema real, esto vendría de una API
      // Por ahora, simulamos errores basados en lo que sabemos que está ocurriendo
      const mockErrors: ErrorLog[] = [
        {
          id: '1',
          level: 'ERROR',
          category: 'error_capture',
          message: 'REACT: Cannot read properties of undefined (reading \'length\')',
          context: {
            component: 'ViewProyecto',
            module: 'proyectos',
            operation: 'render',
            stack: 'at ViewProyecto.render (view-proyecto.tsx:331:12)...',
            url: window.location.href,
            userAgent: navigator.userAgent
          },
          timestamp: Date.now() - 300000, // 5 minutos atrás
          resolved: false
        },
        {
          id: '2',
          level: 'ERROR',
          category: 'auth_error_boundary',
          message: 'Error capturado: Cannot read properties of undefined (reading \'length\')',
          context: {
            component: 'ViewProyecto',
            module: 'proyectos',
            errorBoundary: 'AuthErrorBoundary',
            operation: 'render',
            stack: 'at ViewProyecto.render (view-proyecto.tsx:331:12)...'
          },
          timestamp: Date.now() - 300000,
          resolved: false
        }
      ]
      
      setErrors(mockErrors)
    } catch (error) {
      console.error('Error cargando errores:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsResolved = (errorId: string) => {
    setErrors(prev => 
      prev.map(error => 
        error.id === errorId 
          ? { ...error, resolved: true }
          : error
      )
    )
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const getErrorSeverity = (level: string) => {
    switch (level) {
      case 'FATAL':
        return { color: 'bg-red-500', text: 'Crítico' }
      case 'ERROR':
        return { color: 'bg-orange-500', text: 'Error' }
      default:
        return { color: 'bg-gray-500', text: 'Info' }
    }
  }

  const unresolvedErrors = errors.filter(error => !error.resolved)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando errores...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Errores Críticos ({unresolvedErrors.length} sin resolver)
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Errores que requieren atención inmediata
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        )}
      </div>

      {/* Error List */}
      <div className="space-y-4">
        {unresolvedErrors.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                ¡Excelente!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No hay errores críticos pendientes
              </p>
            </CardContent>
          </Card>
        ) : (
          unresolvedErrors.map((error) => {
            const severity = getErrorSeverity(error.level)
            return (
              <Card key={error.id} className="border-l-4 border-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={`${severity.color} text-white`}>
                        {severity.text}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {error.category}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimestamp(error.timestamp)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsResolved(error.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar Resuelto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {error.message}
                      </h4>
                    </div>
                    
                    {error.context && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Información Detallada
                        </h5>
                        <div className="space-y-2 text-sm">
                          {error.context.component && (
                            <div>
                              <strong>Componente:</strong> 
                              <Badge variant="secondary" className="ml-2">
                                {error.context.component}
                              </Badge>
                            </div>
                          )}
                          {error.context.module && (
                            <div>
                              <strong>Módulo:</strong> 
                              <Badge variant="secondary" className="ml-2">
                                {error.context.module}
                              </Badge>
                            </div>
                          )}
                          {error.context.operation && (
                            <div>
                              <strong>Operación:</strong> 
                              <span className="text-gray-600 dark:text-gray-400 ml-2">
                                {error.context.operation}
                              </span>
                            </div>
                          )}
                          {error.context.url && (
                            <div>
                              <strong>URL:</strong> 
                              <span className="text-gray-600 dark:text-gray-400 ml-2 font-mono text-xs">
                                {error.context.url}
                              </span>
                            </div>
                          )}
                          {error.context.stack && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                                Ver Stack Trace
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                {error.context.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Última actualización: {formatTimestamp(Date.now())}
        </div>
        <Button variant="outline" onClick={loadErrors}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
    </div>
  )
}
