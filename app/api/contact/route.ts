import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, asunto, mensaje } = await request.json()

    // Validar campos requeridos
    if (!nombre || !email || !asunto || !mensaje) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: 'EduPlanner Contacto <noreply@eduplanner.mx>',
      to: ['soporte@eduplanner.mx'],
      subject: `[Contacto EduPlanner] ${asunto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nuevo Mensaje de Contacto</h1>
            <p style="color: white; margin: 10px 0 0 0;">EduPlanner - Centro de Ayuda</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Información del Contacto</h2>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #555;">Nombre:</strong>
                <p style="margin: 5px 0; color: #666;">${nombre}</p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #555;">Email:</strong>
                <p style="margin: 5px 0; color: #666;">${email}</p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #555;">Asunto:</strong>
                <p style="margin: 5px 0; color: #666;">${asunto}</p>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #555;">Mensaje:</strong>
                <div style="margin: 10px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                  <p style="margin: 0; color: #333; white-space: pre-wrap;">${mensaje}</p>
                </div>
              </div>
              
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Este mensaje fue enviado desde el formulario de contacto de EduPlanner
                </p>
                <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                  Fecha: ${new Date().toLocaleString('es-MX', { 
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
        </div>
      `,
      replyTo: email
    })

    if (error) {
      console.error('Error enviando email:', error)
      return NextResponse.json(
        { error: 'Error al enviar el mensaje. Inténtalo de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Mensaje enviado exitosamente. Te responderemos pronto.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error en API de contacto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
