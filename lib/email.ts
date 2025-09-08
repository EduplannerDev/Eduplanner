import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface FeedbackEmailData {
  feedbackText: string;
  feedbackType: string;
  userEmail?: string;
  imageUrl?: string;
}

// Función para obtener el logo de EduPlanner como imagen del remitente
function getEduPlannerLogo(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/images/Logo.png`;
}

// Interfaz para datos de correo general
interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
    cid?: string;
  }>;
}

// Función general para enviar correos con el logo de EduPlanner
export async function sendEmailWithLogo(data: EmailData) {
  try {
    const eduPlannerLogo = getEduPlannerLogo();
    const fromEmail = process.env.FROM_EMAIL || 'Eduplanner <onboarding@resend.dev>';
    
    console.log('🔍 sendEmailWithLogo configuración:', {
      fromEmail,
      eduPlannerLogo,
      toCount: Array.isArray(data.to) ? data.to.length : 1,
      subject: data.subject,
      hasApiKey: !!process.env.RESEND_API_KEY
    });
    
    // Agregar el logo como attachment si no se especifica lo contrario
    const defaultAttachments = [
      {
        filename: 'logo.png',
        path: eduPlannerLogo,
        cid: 'eduplanner-logo'
      }
    ];
    
    const attachments = data.attachments ? [...defaultAttachments, ...data.attachments] : defaultAttachments;
    
    const emailPayload = {
      from: fromEmail,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
      attachments
    };
    
    console.log('📤 Enviando correo a Resend:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      attachmentsCount: attachments.length
    });
    
    const result = await resend.emails.send(emailPayload);
    
    console.log('✅ Respuesta de Resend:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en sendEmailWithLogo:', {
      error,
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Función para crear el template base de correo con logo
export function createEmailTemplate({
  title,
  content,
  showLogo = true
}: {
  title: string;
  content: string;
  showLogo?: boolean;
}) {
  const eduPlannerLogo = getEduPlannerLogo();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        ${showLogo ? `
        <!-- Logo de EduPlanner -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${eduPlannerLogo}" alt="EduPlanner" style="height: 60px; width: auto;" />
        </div>
        ` : ''}
        <h1 style="color: #333; margin-bottom: 20px; text-align: center;">
          ${title}
        </h1>
        
        <div style="margin-bottom: 20px;">
          ${content}
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #6c757d; font-size: 14px; margin: 0;">
            Este email fue enviado automáticamente desde EduPlanner
          </p>
          <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
            Fecha: ${new Date().toLocaleString('es-ES', { 
              timeZone: 'America/Mexico_City',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function sendFeedbackNotification(data: FeedbackEmailData) {
  try {
    const { feedbackText, feedbackType, userEmail, imageUrl } = data;
    
    // Mapear tipos de feedback a emojis y títulos
    const typeMap: Record<string, { emoji: string; title: string }> = {
      bug: { emoji: '🐞', title: 'Reporte de Error' },
      feature: { emoji: '💡', title: 'Sugerencia de Función' },
      question: { emoji: '❓', title: 'Pregunta' },
      love: { emoji: '❤️', title: 'Comentario Positivo' },
      other: { emoji: '✍️', title: 'Otro' }
    };
    
    const feedbackInfo = typeMap[feedbackType] || typeMap.other;
    
    // Crear contenido del email
    const emailContent = `
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #495057; margin: 0 0 10px 0; font-size: 18px;">
          Tipo: ${feedbackInfo.title}
        </h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 10px;">Mensaje:</h3>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
          <p style="margin: 0; line-height: 1.6; color: #495057;">${feedbackText}</p>
        </div>
      </div>
      
      ${userEmail ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; margin-bottom: 10px;">Email del usuario:</h3>
          <p style="margin: 0; color: #007bff; font-weight: 500;">${userEmail}</p>
        </div>
      ` : ''}
      
      ${imageUrl ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; margin-bottom: 10px;">Imagen adjunta:</h3>
          <img src="${imageUrl}" alt="Imagen del feedback" style="max-width: 100%; height: auto; border-radius: 5px; border: 1px solid #ddd;" />
        </div>
      ` : ''}
    `;
    
    // Usar el template base con logo
    const emailHtml = createEmailTemplate({
      title: `${feedbackInfo.emoji} Nuevo Feedback Recibido`,
      content: emailContent
    });
    
    const notificationEmail = process.env.NOTIFICATION_EMAIL || 'admin@eduplanner.mx';
    
    // Usar la función general para enviar email con logo
    const attachments = imageUrl ? [{
      filename: 'feedback-image.jpg',
      path: imageUrl,
      cid: 'feedback-image'
    }] : undefined;
    
    const result = await sendEmailWithLogo({
      to: notificationEmail,
      subject: `${feedbackInfo.emoji} Nuevo Feedback: ${feedbackInfo.title}`,
      html: emailHtml,
      attachments
    });
    
    return result;
  } catch (error) {
    console.error('Error sending feedback notification email:', error);
    throw error;
  }
}

// Función para enviar email de bienvenida/creación de cuenta
export async function sendWelcomeEmail({
  to,
  userName,
  loginUrl
}: {
  to: string;
  userName: string;
  loginUrl?: string;
}) {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #007bff; margin-bottom: 15px;">¡Bienvenido a EduPlanner!</h2>
      <p style="font-size: 16px; color: #495057; line-height: 1.6;">
        Hola <strong>${userName}</strong>, tu cuenta ha sido creada exitosamente.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; color: #495057; line-height: 1.6;">
        Ya puedes acceder a la plataforma y comenzar a utilizar todas las herramientas disponibles para la gestión educativa.
      </p>
    </div>
    
    ${loginUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 500;">
          Acceder a EduPlanner
        </a>
      </div>
    ` : ''}
    
    <div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-radius: 5px;">
      <p style="margin: 0; color: #1565c0; font-size: 14px;">
        <strong>Tip:</strong> Guarda este correo para futuras referencias.
      </p>
    </div>
  `;
  
  const emailHtml = createEmailTemplate({
    title: '¡Bienvenido a EduPlanner!',
    content
  });
  
  return await sendEmailWithLogo({
    to,
    subject: 'Bienvenido a EduPlanner - Cuenta creada exitosamente',
    html: emailHtml
  });
}

// Función para enviar email de recuperación de contraseña
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName
}: {
  to: string;
  resetUrl: string;
  userName?: string;
}) {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #dc3545; margin-bottom: 15px;">Recuperación de Contraseña</h2>
      <p style="font-size: 16px; color: #495057; line-height: 1.6;">
        ${userName ? `Hola <strong>${userName}</strong>, h` : 'H'}emos recibido una solicitud para restablecer tu contraseña.
      </p>
    </div>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
      <p style="margin: 0; color: #856404; line-height: 1.6;">
        <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 500;">
        Restablecer Contraseña
      </a>
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background-color: #f8d7da; border-radius: 5px;">
      <p style="margin: 0; color: #721c24; font-size: 14px;">
        Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.
      </p>
    </div>
  `;
  
  const emailHtml = createEmailTemplate({
    title: 'Recuperación de Contraseña',
    content
  });
  
  return await sendEmailWithLogo({
    to,
    subject: 'EduPlanner - Recuperación de contraseña',
    html: emailHtml
  });
}

// Función para enviar email de invitación
export async function sendInvitationEmail({
  to,
  inviterName,
  plantelName,
  role,
  invitationUrl
}: {
  to: string;
  inviterName: string;
  plantelName: string;
  role: string;
  invitationUrl: string;
}) {
  const roleNames: Record<string, string> = {
    'administrador': 'Administrador',
    'director': 'Director',
    'profesor': 'Profesor',
    'secretario': 'Secretario'
  };
  
  const roleName = roleNames[role] || role;
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #28a745; margin-bottom: 15px;">¡Has sido invitado a EduPlanner!</h2>
      <p style="font-size: 16px; color: #495057; line-height: 1.6;">
        <strong>${inviterName}</strong> te ha invitado a unirte a <strong>${plantelName}</strong> como <strong>${roleName}</strong>.
      </p>
    </div>
    
    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
      <p style="margin: 0; color: #155724; line-height: 1.6;">
        <strong>🎉 ¡Excelente!</strong> Podrás acceder a todas las herramientas de gestión educativa de EduPlanner.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 500;">
        Aceptar Invitación
      </a>
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background-color: #e2e3e5; border-radius: 5px;">
      <p style="margin: 0; color: #383d41; font-size: 14px;">
        <strong>Nota:</strong> Al aceptar la invitación, podrás crear tu contraseña y acceder inmediatamente a la plataforma.
      </p>
    </div>
  `;
  
  const emailHtml = createEmailTemplate({
    title: 'Invitación a EduPlanner',
    content
  });
  
  return await sendEmailWithLogo({
    to,
    subject: `Invitación a EduPlanner - ${plantelName}`,
    html: emailHtml
  });
}

// Función para enviar correo personalizado (solo para administradores)
export async function sendCustomEmail({
  to,
  subject,
  content,
  showLogo = true
}: {
  to: string | string[];
  subject: string;
  content: string;
  showLogo?: boolean;
}) {
  console.log('🔍 sendCustomEmail llamada con:', {
    to: Array.isArray(to) ? `${to.length} destinatarios` : to,
    subject,
    contentLength: content.length,
    showLogo
  });

  // Verificar configuración de Resend
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY no está configurada');
    throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
  }

  const emailHtml = createEmailTemplate({
    title: subject,
    content,
    showLogo
  });
  
  console.log('📧 Enviando correo con template generado');
  
  try {
    const result = await sendEmailWithLogo({
      to,
      subject,
      html: emailHtml
    });
    
    console.log('✅ sendCustomEmail exitoso:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en sendCustomEmail:', error);
    throw error;
  }
}