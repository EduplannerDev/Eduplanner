# Sistema de Notificaciones Estandarizado

Este documento describe el sistema unificado de notificaciones implementado en Eduplanner para garantizar consistencia visual y de experiencia de usuario en toda la aplicación.

## Colores Estandarizados

El sistema utiliza los siguientes colores para cada tipo de notificación:

### 🟢 Éxito (Success)
- **Claro**: `border-green-500 bg-green-50 text-green-900`
- **Oscuro**: `border-green-800 bg-green-950 text-green-100`
- **Uso**: Operaciones completadas exitosamente, guardado de datos, confirmaciones

### 🔴 Error (Error)
- **Claro**: `border-red-500 bg-red-50 text-red-900`
- **Oscuro**: `border-red-800 bg-red-950 text-red-100`
- **Uso**: Errores de validación, fallos de conexión, operaciones fallidas

### 🟡 Advertencia (Warning)
- **Claro**: `border-yellow-500 bg-yellow-50 text-yellow-900`
- **Oscuro**: `border-yellow-800 bg-yellow-950 text-yellow-100`
- **Uso**: Advertencias, límites alcanzados, acciones que requieren atención

### 🔵 Información (Info)
- **Claro**: `border-border bg-background text-foreground`
- **Oscuro**: Sigue el tema del sistema
- **Uso**: Información general, tips, mensajes neutros

## Uso del Hook `useNotification`

### Importación
```typescript
import { useNotification } from '@/hooks/use-notification'
```

### Uso Básico
```typescript
function MiComponente() {
  const { success, error, warning, info } = useNotification()

  const handleSave = async () => {
    try {
      await saveData()
      success('Datos guardados exitosamente')
    } catch (err) {
      error('Error al guardar los datos')
    }
  }

  const handleWarning = () => {
    warning('Has alcanzado el límite de usuarios')
  }

  const handleInfo = () => {
    info('Recuerda revisar tu configuración')
  }

  return (
    <button onClick={handleSave}>Guardar</button>
  )
}
```

### Uso Avanzado con Opciones
```typescript
function MiComponente() {
  const { success, error } = useNotification()

  const handleComplexOperation = async () => {
    try {
      await complexOperation()
      success('Operación completada', {
        title: 'Éxito',
        description: 'La operación se completó sin errores',
        duration: 5000
      })
    } catch (err) {
      error('Error en la operación', {
        title: 'Error Crítico',
        description: 'Por favor contacta al administrador',
        duration: 8000
      })
    }
  }
}
```

## Funciones Directas (para migración rápida)

Si prefieres usar funciones directas sin hook:

```typescript
import { notification } from '@/hooks/use-notification'

// Uso directo
notification.success('Mensaje de éxito')
notification.error('Mensaje de error')
notification.warning('Mensaje de advertencia')
notification.info('Mensaje informativo')
```

## Migración desde el Sistema Anterior

### Desde `toast` de sonner
```typescript
// ❌ Antes
import { toast } from 'sonner'
toast.success('Mensaje')
toast.error('Error')

// ✅ Ahora
import { useNotification } from '@/hooks/use-notification'
const { success, error } = useNotification()
success('Mensaje')
error('Error')
```

### Desde `useToast` de shadcn
```typescript
// ❌ Antes
import { useToast } from '@/hooks/use-toast'
const { toast } = useToast()
toast({
  title: 'Error',
  description: 'Algo salió mal',
  variant: 'destructive'
})

// ✅ Ahora
import { useNotification } from '@/hooks/use-notification'
const { error } = useNotification()
error('Algo salió mal', {
  title: 'Error'
})
```

## Cuándo Usar Cada Tipo

### ✅ Success (Éxito)
- Datos guardados correctamente
- Usuario creado exitosamente
- Archivo subido
- Operación completada
- Configuración actualizada

### ❌ Error (Error)
- Fallos de validación
- Errores de conexión
- Operaciones fallidas
- Permisos insuficientes
- Datos corruptos

### ⚠️ Warning (Advertencia)
- Límites de uso alcanzados
- Acciones que requieren confirmación
- Configuraciones subóptimas
- Datos que expiran pronto
- Funcionalidades deprecadas

### ℹ️ Info (Información)
- Tips y consejos
- Información de estado
- Mensajes de bienvenida
- Actualizaciones de sistema
- Recordatorios generales

## Mejores Prácticas

1. **Consistencia**: Usa siempre el hook `useNotification` para mantener consistencia
2. **Claridad**: Los mensajes deben ser claros y accionables
3. **Duración**: Ajusta la duración según la importancia del mensaje
4. **Contexto**: Proporciona contexto suficiente en el título y descripción
5. **Accesibilidad**: Los colores están optimizados para contraste y legibilidad

## Componentes Actualizados

Los siguientes componentes han sido actualizados para soportar las nuevas variantes:

- `components/ui/toast.tsx` - Variantes success, warning añadidas
- `components/ui/sonner.tsx` - Estilos estandarizados
- `hooks/use-notification.ts` - Hook unificado (nuevo)
- `app/layout.tsx` - Ambos toasters configurados

## Soporte para Temas

El sistema soporta automáticamente modo claro y oscuro, adaptando los colores según el tema activo del usuario.