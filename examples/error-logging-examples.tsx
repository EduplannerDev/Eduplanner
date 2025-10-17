/**
 * Ejemplo de uso del sistema mejorado de logging de errores
 * Este archivo muestra cómo implementar el logging en diferentes escenarios
 */

import { useErrorLogger, useAuthErrorLogger, useNetworkErrorLogger } from '@/hooks/use-error-logger'

// Ejemplo 1: Componente básico con logging de errores
export function EjemploComponenteBasico() {
  const { logComponentError, logAsyncError } = useErrorLogger({
    componentName: 'EjemploComponenteBasico',
    module: 'ejemplos'
  })

  const handleClick = async () => {
    try {
      // Simular operación que puede fallar
      await operacionRiesgosa()
    } catch (error) {
      // Log del error con contexto
      logComponentError(error as Error, 'button_click', {
        buttonId: 'ejemplo-button',
        timestamp: Date.now()
      })
    }
  }

  const operacionRiesgosa = async () => {
    // Simular error
    throw new Error('Error simulado en operación')
  }

  return (
    <button onClick={handleClick}>
      Botón de Ejemplo
    </button>
  )
}

// Ejemplo 2: Componente con logging de autenticación
export function EjemploLoginComponent() {
  const { logAuthFailure, logTokenError } = useAuthErrorLogger('EjemploLoginComponent')

  const handleLogin = async (email: string, password: string) => {
    try {
      // Simular login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Credenciales inválidas')
      }
    } catch (error) {
      // Log específico para errores de auth
      logAuthFailure(error as Error, 'login_attempt', {
        email: email.substring(0, 3) + '***', // Email parcialmente oculto
        attemptTime: Date.now()
      })
    }
  }

  const handleTokenRefresh = async () => {
    try {
      // Simular refresh de token
      await refreshToken()
    } catch (error) {
      // Log específico para errores de token
      logTokenError(error as Error)
    }
  }

  const refreshToken = async () => {
    throw new Error('Token expirado')
  }

  return (
    <div>
      <button onClick={() => handleLogin('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={handleTokenRefresh}>
        Refresh Token
      </button>
    </div>
  )
}

// Ejemplo 3: Componente con logging de red
export function EjemploApiComponent() {
  const { logApiError, logFetchError } = useNetworkErrorLogger('EjemploApiComponent')

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      // Log específico para errores de API
      logApiError(error as Error, `/api/users/${userId}`, 'GET', {
        userId,
        retryCount: 0
      })
    }
  }

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error en la subida del archivo')
      }
    } catch (error) {
      // Log específico para errores de fetch
      logFetchError(error as Error, '/api/upload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
    }
  }

  return (
    <div>
      <button onClick={() => fetchUserData('123')}>
        Obtener Usuario
      </button>
      <input 
        type="file" 
        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
      />
    </div>
  )
}

// Ejemplo 4: Manejo de errores de DOM (insertBefore, etc.)
export function EjemploDOMComponent() {
  const { logComponentError } = useErrorLogger({
    componentName: 'EjemploDOMComponent',
    module: 'dom-examples'
  })

  const handleDOMOperation = () => {
    try {
      // Simular operación DOM que puede fallar
      const container = document.getElementById('container')
      const newElement = document.createElement('div')
      
      if (container) {
        // Esta operación puede fallar si hay problemas con el DOM
        container.insertBefore(newElement, container.firstChild)
      }
    } catch (error) {
      // El sistema automáticamente captura errores de DOM como insertBefore
      // pero también podemos logearlos manualmente para contexto adicional
      logComponentError(error as Error, 'dom_manipulation', {
        operation: 'insertBefore',
        containerId: 'container',
        elementType: 'div'
      })
    }
  }

  return (
    <div id="container">
      <button onClick={handleDOMOperation}>
        Operación DOM
      </button>
    </div>
  )
}

// Ejemplo 5: Error Boundary personalizado
export class EjemploErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Usar el sistema de logging directamente
    import('@/lib/error-logger').then(({ logReactError }) => {
      logReactError(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'EjemploErrorBoundary'
      }, 'EjemploErrorBoundary')
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Algo salió mal</h2>
          <p>Se ha producido un error en este componente.</p>
          <details>
            <summary>Detalles del error</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

// Ejemplo 6: Hook personalizado con logging
export function useEjemploHook() {
  const { logAsyncError } = useErrorLogger({
    componentName: 'useEjemploHook',
    module: 'custom-hooks'
  })

  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ejemplo')
      const result = await response.json()
      setData(result)
    } catch (err) {
      const error = err as Error
      setError(error)
      
      // Log del error con contexto del hook
      logAsyncError(error, 'fetch_data', {
        endpoint: '/api/ejemplo',
        retryAttempt: 0
      })
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fetchData }
}
