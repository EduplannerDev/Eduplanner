"use client"

import { useEffect } from 'react'
import { errorLogger } from '@/lib/error-logger'

/**
 * Provider que inicializa el sistema de logging de errores globales
 * Se ejecuta una vez al cargar la aplicación
 */
export function ErrorLoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // El errorLogger ya se inicializa automáticamente al importarse
    // pero podemos agregar configuración adicional aquí si es necesario
    
    // Log de inicialización
    console.log('🔧 Sistema de logging de errores inicializado')
    
    // Configurar logging adicional para desarrollo
    if (process.env.NODE_ENV === 'development') {
      // Interceptar console.error para logging adicional
      const originalConsoleError = console.error
      console.error = (...args) => {
        // Log original
        originalConsoleError.apply(console, args)
        
        // Log adicional si es un error
        if (args[0] instanceof Error) {
          errorLogger.logError('javascript', args[0], {
            module: 'console_error',
            action: 'console_error_intercept'
          })
        }
      }
    }
  }, [])

  return <>{children}</>
}
