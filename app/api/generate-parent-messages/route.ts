import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, tone, studentId, studentInfo, teacherInfo } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY no está configurada")
      return new Response('Error de configuración del servidor', { status: 500 });
    }

    if (!studentInfo) {
      return new Response('Información del estudiante requerida', { status: 400 });
    }

    // Construir información del estudiante para el contexto
    const studentContext = `
INFORMACIÓN DEL ESTUDIANTE:
- Nombre: ${studentInfo.nombre_completo}
- Grupo: ${studentInfo.grupo}
- Grado: ${studentInfo.grado}
- Nivel: ${studentInfo.nivel}
- Número de lista: ${studentInfo.numero_lista}
- Ciclo escolar: ${studentInfo.ciclo_escolar}
${studentInfo.nombre_padre ? `- Padre: ${studentInfo.nombre_padre}` : ''}
${studentInfo.correo_padre ? `- Correo del padre: ${studentInfo.correo_padre}` : ''}
${studentInfo.telefono_padre ? `- Teléfono del padre: ${studentInfo.telefono_padre}` : ''}
${studentInfo.nombre_madre ? `- Madre: ${studentInfo.nombre_madre}` : ''}
${studentInfo.correo_madre ? `- Correo de la madre: ${studentInfo.correo_madre}` : ''}
${studentInfo.telefono_madre ? `- Teléfono de la madre: ${studentInfo.telefono_madre}` : ''}
${studentInfo.notas_generales ? `- Notas generales: ${studentInfo.notas_generales}` : ''}
`;

    // Definir el tono según la selección
    const toneInstructions = {
      "Formal y Profesional": "Utiliza un lenguaje formal, respetuoso y profesional. Incluye saludos cordiales y despedidas apropiadas. Mantén un tono serio pero amable.",
      "Cercano y Amistoso": "Usa un lenguaje cálido y cercano, pero manteniendo el respeto. Incluye expresiones amigables y un tono más personal y empático.",
      "Breve y Directo": "Sé conciso y directo al punto. Usa frases cortas y claras. Mantén el respeto pero ve directo al asunto principal."
    };

    const selectedToneInstruction = toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions["Formal y Profesional"];

    const systemPrompt = `A partir de ahora, actúa como un asistente especializado en generar mensajes profesionales y personalizados para la comunicación entre docentes y padres de familia. Tu objetivo es ayudar a crear mensajes claros, respetuosos y efectivos que aborden diferentes situaciones escolares utilizando la información específica del estudiante.

${studentContext}

INSTRUCCIONES ESPECÍFICAS:

1. **Personalización obligatoria**: SIEMPRE utiliza el nombre del estudiante (${studentInfo.nombre_completo}) en el mensaje. Incluye detalles específicos como grupo (${studentInfo.grupo}), grado (${studentInfo.grado}) cuando sea relevante.

2. **Dirigirse a los padres**: Si conoces los nombres de los padres, dirígete a ellos por su nombre. Si no, usa "Estimados padres de familia" o "Estimados padres de ${studentInfo.nombre_completo}".

3. **Tono del mensaje**: ${selectedToneInstruction}

4. **Estructura del mensaje**:
   - Saludo personalizado dirigido a los padres
   - Identificación clara del estudiante (nombre, grupo, grado)
   - Cuerpo del mensaje con la situación específica
   - Llamada a la acción si es necesaria
   - Despedida profesional con datos de contacto

5. **Tipos de mensajes que puedes generar**:
   - Comunicados sobre rendimiento académico específico
   - Reportes de comportamiento y conducta
   - Felicitaciones por logros y mejoras
   - Citatorios para reuniones
   - Solicitudes de apoyo en casa
   - Informes de participación en clase
   - Comunicados sobre tareas y responsabilidades

6. **Formato de respuesta**:
   - Inicia con un título descriptivo entre **asteriscos**
   - Incluye el mensaje completo y bien estructurado
   - Usa párrafos claros y separados
   - Incluye información de contacto del docente al final

7. **Consideraciones importantes**:
   - Siempre mantén un enfoque constructivo
   - Incluye sugerencias específicas cuando sea apropiado
   - Menciona aspectos positivos cuando sea posible
   - Sé específico sobre fechas, horarios o acciones requeridas
   - Utiliza la información del estudiante para hacer el mensaje más relevante

Ejemplo de estructura:
**[Título del mensaje]**

Estimados [nombres de los padres o "padres de familia"],

Espero se encuentren bien. Me dirijo a ustedes en mi calidad de docente de [materia/grado] para comunicarles [situación específica] relacionada con su hijo/a [nombre del estudiante], quien cursa [grado] en el grupo [grupo].

[Desarrollo del mensaje con detalles específicos]

[Llamada a la acción si es necesaria]

Quedo a su disposición para cualquier duda o comentario.

Saludos cordiales,
${teacherInfo?.nombre_completo || 'Docente'}
${teacherInfo?.email ? `Correo: ${teacherInfo.email}` : ''}
${teacherInfo?.telefono ? `Teléfono: ${teacherInfo.telefono}` : ''}

Recuerda: Cada mensaje debe ser único, personalizado y utilizar la información específica del estudiante proporcionada.`;

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in generate-parent-messages:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
}