"use client"

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react'
import { clearSupabaseStorage, forceAuthReset } from '@/lib/auth-utils'
import { logReactError, logAuthError } from '@/lib/error-logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  isAuthError: boolean
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isAuthError: false
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Verificar si es un error de autenticación
    const isAuthError = 
      error.message.includes('refresh_token_not_found') ||
      error.message.includes('Invalid Refresh Token') ||
      error.message.includes('AuthApiError') ||
      error.message.includes('Refresh Token Not Found') ||
      error.message.includes('insertBefore') || // Capturar errores de DOM comunes
      error.message.includes('appendChild') ||
      error.message.includes('removeChild')

    return {
      hasError: true,
      error,
      isAuthError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo)
    
    // Determinar el tipo de error y usar el logger apropiado
    const isAuthError = 
      error.message.includes('refresh_token_not_found') ||
      error.message.includes('Invalid Refresh Token') ||
      error.message.includes('AuthApiError') ||
      error.message.includes('Refresh Token Not Found')

    const isDOMError = 
      error.message.includes('insertBefore') ||
      error.message.includes('appendChild') ||
      error.message.includes('removeChild')

    // Usar el nuevo sistema de logging mejorado
    if (isAuthError) {
      logAuthError(error, {
        component: 'AuthErrorBoundary',
        action: 'componentDidCatch',
        componentStack: errorInfo.componentStack?.substring(0, 500)
      })
    } else if (isDOMError) {
      logReactError(error, {
        componentStack: errorInfo.componentStack?.substring(0, 500),
        errorBoundary: 'AuthErrorBoundary'
      }, 'AuthErrorBoundary')
    } else {
      logReactError(error, {
        componentStack: errorInfo.componentStack?.substring(0, 500),
        errorBoundary: 'AuthErrorBoundary'
      }, 'AuthErrorBoundary')
    }
    
    // Log optimizado usando el logger ligero (fallback)
    if (typeof window !== 'undefined') {
      import('@/lib/lightweight-logger').then(({ logger }) => {
        logger.error('auth_error_boundary', `Error capturado: ${error.message}`, {
          componentStack: errorInfo.componentStack?.substring(0, 500),
          errorName: error.name,
          isAuthError: this.state.isAuthError,
          errorType: isDOMError ? 'DOM' : isAuthError ? 'Auth' : 'React'
        })
      }).catch(() => {
        // Fallback silencioso si el logger falla
      })
    }
    
    // Si es un error de autenticación, limpiar el storage
    if (this.state.isAuthError) {
      clearSupabaseStorage()
    }
  }

  handleReload = () => {
    // Limpiar storage y recargar
    clearSupabaseStorage()
    window.location.reload()
  }

  handleForceReset = () => {
    // Forzar reset completo de autenticación
    forceAuthReset()
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      isAuthError: false
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full mx-auto p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    Error de Aplicación
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Ha ocurrido un error inesperado en la aplicación. Esto puede ser debido a problemas de conexión, datos corruptos o un error en el código.
                  </p>
                  {this.state.error && (
                    <details className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <summary className="cursor-pointer font-medium">Detalles técnicos</summary>
                      <div className="mt-2 space-y-1">
                        <div><strong>Tipo:</strong> {this.state.error.name}</div>
                        <div><strong>Mensaje:</strong> {this.state.error.message}</div>
                        {this.state.error.message.includes('insertBefore') && (
                          <div className="text-yellow-600">
                            <strong>Nota:</strong> Este es un error común de React cuando hay problemas con el DOM. 
                            Intenta recargar la página.
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={this.handleReload}
                    className="w-full"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recargar Página
                  </Button>
                  
                  <Button 
                    onClick={this.handleReset}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Intentar de Nuevo
                  </Button>

                  <Button 
                    onClick={this.handleForceReset}
                    variant="destructive"
                    className="w-full"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Completo
                  </Button>
                </div>
                
              </div>
            </div>
          </div>
        )
      }

      // Error genérico
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Error General
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
                </p>
                {this.state.error && (
                  <details className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <summary className="cursor-pointer font-medium">Detalles técnicos</summary>
                    <div className="mt-2 space-y-1">
                      <div><strong>Tipo:</strong> {this.state.error.name}</div>
                      <div><strong>Mensaje:</strong> {this.state.error.message}</div>
                      {this.state.error.message.includes('insertBefore') && (
                        <div className="text-yellow-600">
                          <strong>Nota:</strong> Este es un error común de React cuando hay problemas con el DOM. 
                          Intenta recargar la página.
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={this.handleReload}
                  className="w-full"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recargar Página
                </Button>
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Intentar de Nuevo
                </Button>
              </div>
              
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AuthErrorBoundary