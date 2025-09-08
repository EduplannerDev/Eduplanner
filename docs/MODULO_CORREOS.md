# 📧 Módulo de Envío de Correos - EduPlanner

## 🎯 Descripción

El módulo de envío de correos permite a los **administradores** de EduPlanner enviar correos personalizados desde la dirección oficial `contacto@eduplanner.mx` con el logo y diseño institucional.

## 🔐 Acceso y Permisos

- **Solo disponible para**: Administradores activos
- **Restricción**: Los usuarios con rol de `director` o `profesor` no pueden acceder
- **Validación**: El sistema verifica el rol del usuario antes de permitir el envío

## 🛠️ Funcionalidades

### ✉️ Envío de Correos Personalizados

- **Asunto personalizable**: Hasta 100 caracteres
- **Contenido flexible**: Hasta 10,000 caracteres con soporte HTML básico
- **Destinatarios múltiples**: Hasta 100 emails por envío
- **Envío masivo**: Opción para enviar a todos los usuarios activos del sistema
- **Logo automático**: Incluye automáticamente el logo de EduPlanner
- **Diseño profesional**: Template responsive y consistente

### 📊 Historial y Auditoría

- **Registro completo**: Todos los envíos se registran en la base de datos
- **Información detallada**: 
  - Usuario que envió el correo
  - Número de destinatarios
  - Fecha y hora del envío
  - Estado (exitoso/error)
  - Mensaje de error si aplica
- **Paginación**: Navegación eficiente del historial
- **Seguimiento**: ID de Resend para tracking avanzado

## 🚀 Cómo Usar

### 1. Acceder al Módulo

1. Inicia sesión como **administrador**
2. En el sidebar, busca la sección **"Administración Global"**
3. Haz clic en **"Envío de Correos"**

### 2. Enviar un Correo

#### ✍️ Completar el Formulario

1. **Asunto**: Escribe un asunto descriptivo (máximo 100 caracteres)
2. **Contenido**: Redacta el mensaje usando texto plano o HTML básico
   - Etiquetas permitidas: `<p>`, `<br>`, `<strong>`, `<em>`, `<ul>`, `<li>`, etc.
   - El logo de EduPlanner se añade automáticamente

#### 👥 Seleccionar Destinatarios

**Opción 1: Destinatarios Específicos**
1. Mantén desactivado "Enviar a todos los usuarios activos"
2. Escribe los emails uno por uno en el campo de destinatarios
3. Presiona Enter o el botón "+" para agregar cada email
4. Los emails inválidos se marcarán en rojo

**Opción 2: Envío Masivo**
1. Activa "Enviar a todos los usuarios activos"
2. El sistema enviará automáticamente a todos los usuarios con estado `activo = true`

#### 📤 Enviar

1. Revisa que toda la información esté correcta
2. Haz clic en **"Enviar Correo"**
3. Espera la confirmación de envío exitoso

### 3. Revisar Historial

1. Ve a la pestaña **"Historial"**
2. Visualiza todos los envíos realizados
3. Revisa el estado de cada envío
4. Navega entre páginas si hay muchos registros

## 🔧 Configuración Técnica

### Variables de Entorno Requeridas

```env
# Resend API
RESEND_API_KEY=tu_api_key_de_resend

# Configuración de Email
FROM_EMAIL="Eduplanner <contacto@eduplanner.mx>"
NEXT_PUBLIC_SITE_URL=https://eduplanner.mx

# Base de datos
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Tabla de Base de Datos

El módulo utiliza la tabla `email_logs` que se crea automáticamente con la migración:

```sql
-- Ejecutar migración
-- supabase/migrations/20240201000001_create_email_logs_table.sql
```

Campos principales:
- `sent_by`: ID del administrador que envió el correo
- `recipients_count`: Número de destinatarios
- `subject`: Asunto del correo
- `content`: Contenido (truncado para el log)
- `success`: Estado del envío
- `resend_id`: ID de Resend para tracking

## 📋 API Endpoints

### POST `/api/send-email`

Envía un correo personalizado.

**Headers requeridos:**
```
Authorization: Bearer <token_supabase>
Content-Type: application/json
```

**Cuerpo de la petición:**
```json
{
  "subject": "Asunto del correo",
  "content": "Contenido del correo (puede incluir HTML)",
  "sendToAllUsers": false,
  "recipients": ["email1@ejemplo.com", "email2@ejemplo.com"]
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Correo enviado exitosamente a 2 destinatario(s)",
  "recipientsCount": 2,
  "emailId": "resend_email_id"
}
```

### GET `/api/send-email`

Obtiene el historial de envíos.

**Parámetros de consulta:**
- `page`: Número de página (por defecto: 1)
- `limit`: Elementos por página (máximo: 50, por defecto: 10)

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

## ⚠️ Limitaciones y Validaciones

### Límites de Envío

- **Destinatarios por envío**: Máximo 100
- **Longitud del asunto**: Máximo 100 caracteres
- **Longitud del contenido**: Máximo 10,000 caracteres
- **Rate limiting**: Definido por los límites de Resend

### Validaciones de Seguridad

- **Autenticación obligatoria**: Token JWT válido
- **Verificación de rol**: Solo administradores activos
- **Validación de emails**: Formato RFC 5322
- **Sanitización de contenido**: Prevención de inyección de código

### Manejo de Errores

- **Emails inválidos**: Se marcan y no se procesan
- **Errores de Resend**: Se registran en el log con detalles
- **Timeouts**: Se manejan gracefully con reintentos

## 🎨 Diseño del Template

### Características del Email

- **Header**: Logo de EduPlanner (60px altura)
- **Cuerpo**: Contenido personalizable con diseño profesional
- **Footer**: Información de EduPlanner y timestamp
- **Responsive**: Compatible con todos los dispositivos
- **Colores**: Paleta institucional de EduPlanner

### Ejemplo de HTML Generado

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: white; padding: 30px; border-radius: 10px;">
    <!-- Logo automático -->
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://eduplanner.mx/images/Logo.png" alt="EduPlanner" style="height: 60px;" />
    </div>
    
    <!-- Título del correo -->
    <h1 style="color: #333; text-align: center;">{subject}</h1>
    
    <!-- Contenido personalizado -->
    <div>{content}</div>
    
    <!-- Footer automático -->
    <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee;">
      <p style="color: #6c757d; font-size: 14px;">
        Este email fue enviado automáticamente desde EduPlanner
      </p>
    </div>
  </div>
</div>
```

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

1. **"Acceso denegado"**: Verificar que el usuario tenga rol de administrador
2. **"Error enviando correo"**: Revisar configuración de Resend
3. **"Emails inválidos"**: Verificar formato de los destinatarios
4. **"Contenido muy largo"**: Reducir el texto a menos de 10,000 caracteres

### Logs y Debugging

- Todos los errores se registran en la consola del servidor
- Los envíos fallidos se guardan en `email_logs` con `success: false`
- Verificar variables de entorno si hay problemas de configuración

### Contacto de Soporte

Para soporte técnico, contactar al equipo de desarrollo de EduPlanner.

---

*Documentación del Módulo de Correos - EduPlanner v1.0*
