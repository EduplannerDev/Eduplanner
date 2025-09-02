# Configuración de Microsoft Clarity

Este proyecto incluye Microsoft Clarity para análisis de comportamiento de usuarios.

## Configuración

### 1. Obtener el Project ID de Clarity

1. Ve a [Microsoft Clarity](https://clarity.microsoft.com/)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Copia el Project ID que se genera

### 2. Configurar la variable de entorno

En tu archivo `.env.local`, reemplaza `tu_clarity_project_id` con tu Project ID real:

```env
NEXT_PUBLIC_CLARITY_PROJECT_ID=tu_project_id_real
```

### 3. Verificar la instalación

- Microsoft Clarity solo se inicializa en producción (`NODE_ENV === 'production'`)
- Para probar en desarrollo, puedes cambiar temporalmente la condición en `components/clarity-analytics.tsx`
- Una vez desplegado, podrás ver los datos en el dashboard de Clarity

## Características

- **Grabaciones de sesión**: Ve cómo los usuarios interactúan con tu aplicación
- **Mapas de calor**: Identifica las áreas más clickeadas
- **Análisis de comportamiento**: Comprende patrones de navegación
- **Detección de errores**: Identifica problemas de UX automáticamente

## Privacidad

Microsoft Clarity cumple con GDPR y otras regulaciones de privacidad. Los datos se procesan de forma anónima y segura.