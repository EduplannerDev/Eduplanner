# Sistema de Correos con Logo de EduPlanner

Este documento explica cómo utilizar el sistema de correos actualizado que incluye automáticamente el logo de EduPlanner en todos los emails enviados desde `noreply@eduplanner.mx`.

## Funciones Disponibles

### 1. `sendEmailWithLogo(data: EmailData)`
Función general para enviar cualquier correo con el logo de EduPlanner.

```typescript
import { sendEmailWithLogo } from '@/lib/email';

const result = await sendEmailWithLogo({
  to: 'usuario@ejemplo.com',
  subject: 'Asunto del correo',
  html: '<p>Contenido HTML del correo</p>'
});
```

### 2. `createEmailTemplate({ title, content, showLogo? })`
Crea un template HTML consistente con el logo de EduPlanner.

```typescript
import { createEmailTemplate } from '@/lib/email';

const emailHtml = createEmailTemplate({
  title: 'Título del Correo',
  content: '<p>Contenido personalizado aquí</p>'
});
```

### 3. `sendWelcomeEmail({ to, userName, loginUrl? })`
Envía un correo de bienvenida cuando se crea una nueva cuenta.

```typescript
import { sendWelcomeEmail } from '@/lib/email';

const result = await sendWelcomeEmail({
  to: 'nuevo@usuario.com',
  userName: 'Juan Pérez',
  loginUrl: 'https://app.eduplanner.mx/login' // Opcional
});
```

### 4. `sendPasswordResetEmail({ to, resetUrl, userName? })`
Envía un correo de recuperación de contraseña.

```typescript
import { sendPasswordResetEmail } from '@/lib/email';

const result = await sendPasswordResetEmail({
  to: 'usuario@ejemplo.com',
  resetUrl: 'https://app.eduplanner.mx/reset-password?token=abc123',
  userName: 'Juan Pérez' // Opcional
});
```

### 5. `sendInvitationEmail({ to, inviterName, plantelName, role, invitationUrl })`
Envía una invitación para unirse a un plantel.

```typescript
import { sendInvitationEmail } from '@/lib/email';

const result = await sendInvitationEmail({
  to: 'nuevo@profesor.com',
  inviterName: 'Director García',
  plantelName: 'Escuela Primaria Benito Juárez',
  role: 'profesor',
  invitationUrl: 'https://app.eduplanner.mx/invitation?token=xyz789'
});
```

### 6. `sendFeedbackNotification(data: FeedbackEmailData)`
Envía notificaciones de feedback (ya actualizada con el logo).

```typescript
import { sendFeedbackNotification } from '@/lib/email';

const result = await sendFeedbackNotification({
  feedbackText: 'Excelente plataforma',
  feedbackType: 'love',
  userEmail: 'usuario@ejemplo.com',
  imageUrl: 'https://ejemplo.com/imagen.jpg' // Opcional
});
```

## Características del Sistema

### Logo Automático
- Todos los correos incluyen automáticamente el logo de EduPlanner
- El logo se obtiene de `/images/Logo.png`
- Se muestra en la parte superior del correo con altura de 60px

### Template Consistente
- Diseño profesional y responsive
- Colores y tipografía consistentes con la marca
- Pie de página automático con fecha y hora
- Fondo con gradiente sutil

### Configuración
Asegúrate de tener estas variables de entorno configuradas:

```env
RESEND_API_KEY=tu_api_key_de_resend
FROM_EMAIL=Eduplanner <noreply@eduplanner.mx>
NEXT_PUBLIC_SITE_URL=https://app.eduplanner.mx
NOTIFICATION_EMAIL=admin@eduplanner.mx
```

## Ejemplos de Uso en APIs

### En una API route para registro de usuario:
```typescript
// app/api/register/route.ts
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: Request) {
  // ... lógica de registro ...
  
  // Enviar email de bienvenida
  await sendWelcomeEmail({
    to: userData.email,
    userName: userData.name,
    loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
  });
  
  return NextResponse.json({ success: true });
}
```

### En una API route para invitaciones:
```typescript
// app/api/invite-user/route.ts
import { sendInvitationEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { email, plantelName, role, inviterName } = await req.json();
  
  // ... lógica de invitación ...
  
  await sendInvitationEmail({
    to: email,
    inviterName,
    plantelName,
    role,
    invitationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/invitation?token=${token}`
  });
  
  return NextResponse.json({ success: true });
}
```

## Notas Importantes

1. **Attachments**: El logo se incluye automáticamente como attachment con CID `eduplanner-logo`
2. **Responsive**: Los templates son responsive y se ven bien en dispositivos móviles
3. **Personalización**: Puedes usar `createEmailTemplate()` para correos personalizados manteniendo la consistencia
4. **Error Handling**: Todas las funciones incluyen manejo de errores apropiado
5. **Timezone**: Las fechas se muestran en horario de México (America/Mexico_City)

## Migración de Código Existente

Si tienes código existente que envía correos, puedes migrarlo fácilmente:

**Antes:**
```typescript
const result = await resend.emails.send({
  from: 'noreply@eduplanner.mx',
  to: 'usuario@ejemplo.com',
  subject: 'Mi asunto',
  html: '<p>Mi contenido</p>'
});
```

**Después:**
```typescript
const emailHtml = createEmailTemplate({
  title: 'Mi Título',
  content: '<p>Mi contenido</p>'
});

const result = await sendEmailWithLogo({
  to: 'usuario@ejemplo.com',
  subject: 'Mi asunto',
  html: emailHtml
});
```