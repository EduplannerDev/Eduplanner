"use client"

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react'
import { clearSupabaseStorage, forceAuthReset } from '@/lib/auth-utils'

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
      error.message.includes('Refresh Token Not Found')

    return {
      hasError: true,
      error,
      isAuthError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo)
    
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
                    Sesión Expirada
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tu sesión ha expirado. Por favor, recarga la página para continuar.
                  </p>
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
                  Algo salió mal
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
                </p>
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