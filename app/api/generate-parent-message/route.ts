import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(request: NextRequest) {
    try {
        // Validar body
        const {
            nombreAlumno,
            nombrePadre,
            tipoIncidencia,
            nivelRiesgo,
            detalleIncidencia
        } = await request.json()

        const prompt = `
Rol: Actúa como el Director de un colegio particular de prestigio. Tu objetivo es redactar un mensaje de WhatsApp para los padres de familia sobre un asunto importante.

Datos del Contexto:
- Nombre del Alumno: ${nombreAlumno}
- Nombre del Padre/Madre: ${nombrePadre || 'Padre de Familia'}
- Tipo de Situación: ${tipoIncidencia}
- Nivel de Riesgo: ${nivelRiesgo}
- Resumen del suceso: ${detalleIncidencia}

Instrucciones de Tono y Estructura:
1. Saludo Personalizado: Comienza con un saludo cordial y formal (Ej: "Estimado Sr. ${nombrePadre || 'Apellido'}").
2. Contexto sin Pánico: Informa que te comunicas desde la Dirección para dar seguimiento a una situación ocurrida hoy con su hijo/a.
3. Claridad Objetiva: Describe brevemente el suceso sin usar lenguaje alarmista, basándote en el nivel de riesgo (${nivelRiesgo}).
4. Enfoque en Protocolos: Menciona que el colegio ya está aplicando los protocolos correspondientes para garantizar el bienestar de todos.
5. Llamado a la Acción (CTA): Finaliza solicitando amablemente una breve llamada, una cita presencial o que el padre esté atento a las indicaciones oficiales.
6. Cierre Profesional: Despídete con cortesía e institucionalidad.

Restricciones:
- El mensaje debe ser breve (máximo 120 palabras) para facilitar la lectura en móviles.
- No emitas juicios de valor ni culpes a nadie; mantente neutral e institucional.
- NO incluyas "Asunto:" o placeholders como "[Nombre]".
    `

        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            prompt: prompt,
            temperature: 0.7,
        })

        return NextResponse.json({ success: true, message: text })

    } catch (error) {
        console.error('Error generating parent message API:', error)
        return NextResponse.json({ error: 'Error generando mensaje' }, { status: 500 })
    }
}
