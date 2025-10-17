# Sistema Mejorado de Logging de Errores

## Descripción

Se ha implementado un sistema mejorado de logging de errores que proporciona información detallada sobre dónde y cuándo ocurren los errores, especialmente útil para errores como `insertBefore` que pueden ocurrir en diferentes módulos.

## Características Principales

### 1. Captura Global de Errores
- **Errores de JavaScript**: Captura errores no manejados y promesas rechazadas
- **Errores de DOM**: Intercepta errores comunes como `insertBefore`, `appendChild`, `removeChild`
- **Errores de React**: Captura errores en componentes y error boundaries
- **Errores de Autenticación**: Manejo específico de errores de auth

### 2. Información Contextual Detallada
- **Módulo/Componente**: Identifica automáticamente dónde ocurrió el error
- **Stack Trace**: Incluye información completa del stack
- **Contexto del Usuario**: ID de usuario, sesión, URL actual
- **Tipo de Error**: Clasifica el error (DOM, React, Auth, Network, etc.)

### 3. Sistema de Logging Optimizado
- **Sampling Inteligente**: Solo guarda un porcentaje de logs para evitar spam
- **Batching**: Procesa logs en lotes para mejor rendimiento
- **Sanitización**: Excluye datos sensibles automáticamente

## Uso en Componentes

### Hook Básico
```typescript
import { useErrorLogger } from '@/hooks/use-error-logger'

function MiComponente() {
  const { logError, logComponentError } = useErrorLogger({
    componentName: 'MiComponente',
    module: 'dashboard'
  })

  const handleError = (error: Error) => {
    logComponentError(error, 'button_click')
  }
}
```

### Hook Específico para Autenticación
```typescript
import { useAuthErrorLogger } from '@/hooks/use-error-logger'

function LoginForm() {
  const { logAuthError, logAuthFailure } = useAuthErrorLogger('LoginForm')

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      logAuthFailure(error, 'signin')
    }
  }
}
```

### Hook para Errores de Red
```typescript
import { useNetworkErrorLogger } from '@/hooks/use-error-logger'

function ApiComponent() {
  const { logApiError } = useNetworkErrorLogger('ApiComponent')

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
    } catch (error) {
      logApiError(error, '/api/data', 'GET')
    }
  }
}
```

## Captura Automática de Errores

### Errores de DOM (como insertBefore)
El sistema intercepta automáticamente errores comunes de DOM y proporciona contexto detallado:

```typescript
// Se captura automáticamente con información como:
{
  errorType: 'dom',
  operation: 'insertBefore',
  newNodeType: 1,
  newNodeName: 'DIV',
  parentNodeType: 1,
  parentNodeName: 'BODY',
  parentNodeId: 'root',
  parentNodeClass: 'container'
}
```

### Errores de React
Los errores en componentes se capturan con información del componente y stack:

```typescript
{
  errorType: 'react',
  component: 'MiComponente',
  componentStack: 'at MiComponente (file.tsx:25:10)...',
  errorBoundary: 'AuthErrorBoundary'
}
```

## Configuración

### Variables de Entorno
```env
NODE_ENV=development  # Habilita logging detallado en consola
```

### Configuración del Logger
```typescript
// En lib/error-logger.ts
export const logger = new LightweightLogger({
  sampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.2,
  batchSize: 100,
  flushInterval: 10000
})
```

## Beneficios

### Para Desarrolladores
- **Debugging Más Fácil**: Información clara sobre dónde ocurren los errores
- **Contexto Detallado**: Stack traces y información del componente
- **Clasificación Automática**: Los errores se categorizan automáticamente

### Para Usuarios
- **Mensajes Más Claros**: Errores específicos con sugerencias de solución
- **Recuperación Automática**: El sistema intenta recuperarse automáticamente
- **Menos Interrupciones**: Mejor manejo de errores comunes

### Para Administradores
- **Monitoreo Mejorado**: Logs estructurados con contexto completo
- **Identificación de Patrones**: Fácil identificación de errores recurrentes
- **Rendimiento Optimizado**: Sistema de logging que no afecta la performance

## Ejemplos de Uso

### Error de insertBefore
```typescript
// Antes: Error genérico sin contexto
// "Failed to execute 'insertBefore' on 'Node'"

// Ahora: Error con contexto completo
{
  message: "Failed to execute 'insertBefore' on 'Node'",
  errorType: "dom",
  operation: "insertBefore",
  component: "ChatComponent",
  module: "chat",
  newNodeType: 1,
  parentNodeId: "messages-container",
  stack: "at ChatComponent.render (chat.tsx:45:12)..."
}
```

### Error de Autenticación
```typescript
// Antes: Error básico
// "Auth error detected: Invalid token"

// Ahora: Error con contexto de auth
{
  message: "Invalid token",
  errorType: "auth",
  component: "LoginForm",
  action: "signin",
  module: "auth",
  userId: "user-123",
  sessionId: "session-456"
}
```

## Migración

### Componentes Existentes
Para migrar componentes existentes, simplemente agregar el hook:

```typescript
// Antes
catch (error) {
  console.error("Error:", error)
}

// Después
const { logComponentError } = useErrorLogger({ componentName: 'MiComponente' })

catch (error) {
  logComponentError(error, 'operation_name')
  console.error("Error:", error) // Mantener para debugging local
}
```

### Error Boundaries
Los error boundaries existentes se mejoran automáticamente con el nuevo sistema.

## Monitoreo y Alertas

El sistema está integrado con el logger ligero existente y puede extenderse para:
- Envío de alertas por email
- Integración con servicios de monitoreo
- Dashboard de errores en tiempo real
- Métricas de estabilidad de la aplicación
