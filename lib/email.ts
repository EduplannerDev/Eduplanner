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
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #333; margin-bottom: 20px; text-align: center;">
            ${feedbackInfo.emoji} Nuevo Feedback Recibido
          </h1>
          
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
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              Este email fue enviado automáticamente desde Eduplanner
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
    
    const notificationEmail = process.env.NOTIFICATION_EMAIL || 'admin@eduplanner.mx';
    
    const fromEmail = process.env.FROM_EMAIL || 'Eduplanner <noreply@eduplanner.mx>';
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: [notificationEmail],
      subject: `${feedbackInfo.emoji} Nuevo Feedback: ${feedbackInfo.title}`,
      html: emailHtml,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending feedback notification email:', error);
    throw error;
  }
}