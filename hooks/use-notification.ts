"use client"

import { toast as sonnerToast } from "sonner"
import { useToast } from "@/hooks/use-toast"

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationOptions {
  title?: string
  description?: string
  duration?: number
}

/**
 * Hook unificado para notificaciones que estandariza los colores y estilos
 * en todo el sistema. Usa sonner por defecto para mejor UX.
 */
export function useNotification() {
  const { toast: shadcnToast } = useToast()

  const showNotification = (
    type: NotificationType,
    message: string,
    options?: NotificationOptions
  ) => {
    const { title, description, duration = 4000 } = options || {}
    
    // Usar sonner como principal por su mejor UX
    switch (type) {
      case 'success':
        sonnerToast.success(title || message, {
          description: description || (title ? message : undefined),
          duration
        })
        break
      
      case 'error':
        sonnerToast.error(title || message, {
          description: description || (title ? message : undefined),
          duration
        })
        break
      
      case 'warning':
        sonnerToast.warning(title || message, {
          description: description || (title ? message : undefined),
          duration
        })
        break
      
      case 'info':
      default:
        sonnerToast(title || message, {
          description: description || (title ? message : undefined),
          duration
        })
        break
    }
  }

  // Métodos de conveniencia
  const success = (message: string, options?: NotificationOptions) => {
    showNotification('success', message, options)
  }

  const error = (message: string, options?: NotificationOptions) => {
    showNotification('error', message, options)
  }

  const warning = (message: string, options?: NotificationOptions) => {
    showNotification('warning', message, options)
  }

  const info = (message: string, options?: NotificationOptions) => {
    showNotification('info', message, options)
  }

  // Método para usar shadcn toast cuando sea necesario (ej: acciones complejas)
  const shadcn = {
    success: (title: string, description?: string) => {
      shadcnToast({
        title,
        description,
        variant: 'success' as any
      })
    },
    error: (title: string, description?: string) => {
      shadcnToast({
        title,
        description,
        variant: 'destructive'
      })
    },
    warning: (title: string, description?: string) => {
      shadcnToast({
        title,
        description,
        variant: 'warning' as any
      })
    },
    info: (title: string, description?: string) => {
      shadcnToast({
        title,
        description,
        variant: 'default'
      })
    }
  }

  return {
    success,
    error,
    warning,
    info,
    showNotification,
    shadcn
  }
}

// Exportar también funciones directas para facilitar la migración
export const notification = {
  success: (message: string, options?: NotificationOptions) => {
    sonnerToast.success(message, {
      ...options,
      className: 'border-green-500 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100'
    })
  },
  error: (message: string, options?: NotificationOptions) => {
    sonnerToast.error(message, {
      ...options,
      className: 'border-red-500 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
    })
  },
  warning: (message: string, options?: NotificationOptions) => {
    sonnerToast.warning(message, {
      ...options,
      className: 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100'
    })
  },
  info: (message: string, options?: NotificationOptions) => {
    sonnerToast(message, options)
  }
}