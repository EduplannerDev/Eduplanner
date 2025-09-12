import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendCustomEmail } from '@/lib/email';

// Crear cliente de Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función para verificar si el usuario es administrador
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, activo')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error verificando rol de usuario:', error);
      return false;
    }

    return profile?.role === 'administrador' && profile?.activo === true;
  } catch (error) {
    console.error('Error en verificación de administrador:', error);
    return false;
  }
}

// Función para validar formato de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para validar múltiples emails
function validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  emails.forEach(email => {
    const trimmedEmail = email.trim();
    if (isValidEmail(trimmedEmail)) {
      valid.push(trimmedEmail);
    } else {
      invalid.push(trimmedEmail);
    }
  });
  
  return { valid, invalid };
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token de autenticación inválido' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea administrador
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden enviar correos masivos.' },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const body = await req.json();
    const { recipients, subject, content, sendToAllUsers = false, senderEmail } = body;

    // Validar datos requeridos
    if (!subject || !content) {
      return NextResponse.json(
        { error: 'El asunto y el contenido del correo son requeridos' },
        { status: 400 }
      );
    }

    // Validar remitente
    const validSenders = ['contacto@eduplanner.mx', 'soporte@eduplanner.mx', 'no-reply@eduplanner.mx'];
    if (senderEmail && !validSenders.includes(senderEmail)) {
      return NextResponse.json(
        { error: 'Remitente no válido' },
        { status: 400 }
      );
    }

    // Validar longitud del contenido
    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'El contenido del correo es demasiado largo (máximo 10,000 caracteres)' },
        { status: 400 }
      );
    }

    let emailList: string[] = [];

    if (sendToAllUsers) {
      // Obtener todos los usuarios activos de la base de datos
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email')
        .eq('activo', true)
        .not('email', 'is', null);

      if (profilesError) {
        console.error('Error obteniendo usuarios:', profilesError);
        return NextResponse.json(
          { error: 'Error obteniendo lista de usuarios' },
          { status: 500 }
        );
      }

      emailList = profiles?.map(profile => profile.email).filter(Boolean) || [];
    } else {
      // Validar lista de destinatarios
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json(
          { error: 'Lista de destinatarios requerida' },
          { status: 400 }
        );
      }

      if (recipients.length > 100) {
        return NextResponse.json(
          { error: 'Máximo 100 destinatarios por envío' },
          { status: 400 }
        );
      }

      // Validar formato de emails
      const { valid, invalid } = validateEmails(recipients);
      
      if (invalid.length > 0) {
        return NextResponse.json(
          { 
            error: 'Algunos emails tienen formato inválido',
            invalidEmails: invalid 
          },
          { status: 400 }
        );
      }

      emailList = valid;
    }

    if (emailList.length === 0) {
      return NextResponse.json(
        { error: 'No hay destinatarios válidos para enviar' },
        { status: 400 }
      );
    }

    // Enviar email usando el servicio existente
    try {
      
      const result = await sendCustomEmail({
        to: emailList,
        subject,
        content,
        showLogo: true,
        senderEmail: senderEmail || 'contacto@eduplanner.mx'
      });
      

      // Registrar el envío en la base de datos para auditoría
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          sent_by: user.id,
          recipients_count: emailList.length,
          subject,
          content: content.substring(0, 500), // Solo primeros 500 caracteres para el log
          sent_at: new Date().toISOString(),
          success: true,
          resend_id: result.data?.id
        });

      if (logError) {
        console.error('Error registrando log de email:', logError);
        // No fallar el request por error de logging
      }

      return NextResponse.json({
        success: true,
        message: `Correo enviado exitosamente a ${emailList.length} destinatario(s)`,
        recipientsCount: emailList.length,
        emailId: result.data?.id
      });

    } catch (emailError) {
      console.error('❌ Error enviando correo:', {
        error: emailError,
        message: emailError instanceof Error ? emailError.message : 'Error desconocido',
        stack: emailError instanceof Error ? emailError.stack : undefined
      });
      
      // Registrar error en la base de datos
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          sent_by: user.id,
          recipients_count: emailList.length,
          subject,
          content: content.substring(0, 500),
          sent_at: new Date().toISOString(),
          success: false,
          error_message: emailError instanceof Error ? emailError.message : 'Error desconocido'
        });

      if (logError) {
        console.error('Error registrando log de email:', logError);
      }

      return NextResponse.json(
        { error: 'Error enviando el correo. Por favor intenta nuevamente.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error en API de envío de correos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para obtener historial de envíos (solo administradores)
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token de autenticación inválido' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea administrador
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden ver el historial.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Máximo 50
    const offset = (page - 1) * limit;

    // Obtener historial de envíos
    const { data: emailLogs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('Error obteniendo historial:', logsError);
      return NextResponse.json(
        { error: 'Error obteniendo historial de envíos' },
        { status: 500 }
      );
    }

    // Obtener total de registros para paginación
    const { count, error: countError } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error obteniendo conteo:', countError);
      return NextResponse.json(
        { error: 'Error obteniendo total de registros' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: emailLogs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error en GET de historial de correos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
