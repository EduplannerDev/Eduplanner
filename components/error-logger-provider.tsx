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


    // Configurar logging adicional para desarrollo
    if (process.env.NODE_ENV === 'development') {
      // Guardar referencia original
      const originalConsoleError = console.error

      // Interceptar console.error para logging adicional
      console.error = (...args) => {
        // Siempre llamar al console.error original primero
        try {
          originalConsoleError.apply(console, args)
        } catch (e) {
          // Si falla, intentar con console.log como fallback
          console.log('Error en console.error:', e)
        }

        // Log adicional si es un error válido
        try {
          if (args[0] instanceof Error) {
            // Filtrar errores de librerías externas
            const stack = args[0].stack || ''
            const isExternalLibrary = stack.includes('node_modules') ||
              stack.includes('driver.js') ||
              stack.includes('webpack')

            // Solo loggear errores de nuestra aplicación
            if (!isExternalLibrary) {
              errorLogger.logError('javascript', args[0], {
                module: 'console_error',
                action: 'console_error_intercept'
              }).catch(() => {
                // Silenciar errores de logging
              })
            }
          }
        } catch (e) {
          // Silenciar cualquier error en el logging para no afectar la aplicación
        }
      }

      // Cleanup function para restaurar console.error original
      return () => {
        console.error = originalConsoleError
      }
    }
  }, [])

  return <>{children}</>
}
