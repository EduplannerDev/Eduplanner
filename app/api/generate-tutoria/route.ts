import { NextRequest, NextResponse } from 'next/server'
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { logAIUsage, createTimer } from '@/lib/ai-usage-tracker'

export const maxDuration = 30

export async function POST(request: NextRequest) {
    const timer = createTimer()

    try {
        const { prompt, maxTokens = 2000, temperature = 0.7 } = await request.json()

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt es requerido' },
                { status: 400 }
            )
        }

        // Usando gemini-2.5-flash como en generate-nem y generate-cime
        const result = await generateText({
            model: google("gemini-2.5-flash"),
            system: `Eres un experto pedagogo especializado en Tutoría y Educación Socioemocional en México.
Tu objetivo es crear planeaciones de tutoría detalladas, empáticas y prácticas.

Estructura requerida (usa Markdown):
# [Título del Tema]
**Grado:** [Grado] | **Dimensión:** [Dimensión]

## Propósito de la Sesión
[Descripción clara del objetivo]

## Secuencia Didáctica
### Inicio (10 min)
- [Actividad rompehielos o introductoria]
- [Preguntas detonadoras]

### Desarrollo (30 min)
- [Actividad principal práctica/reflexiva]
- [Dinámica grupal o individual]

### Cierre (10 min)
- [Reflexión final]
- [Compromiso o tarea]

## Materiales
- [Lista de materiales]

## Evaluación/Seguimiento
- [Criterios de observación]

IMPORTANTE:
- Adapta el lenguaje a la edad de los estudiantes.
- Enfócate en el desarrollo integral.
- Sé específico en las instrucciones.
- No uses separadores como '---', usa saltos de línea.`,
            prompt,
            temperature: temperature,
        })

        const geminiResponse = result.text

        // Log AI usage for analytics
        logAIUsage({
            endpoint: '/api/generate-tutoria',
            latencyMs: timer.elapsed(),
            success: !!geminiResponse
        }).catch(() => { })

        if (!geminiResponse) {
            return NextResponse.json(
                { error: 'No se pudo generar el contenido' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            content: geminiResponse,
        })

    } catch (error) {
        logAIUsage({
            endpoint: '/api/generate-tutoria',
            latencyMs: timer.elapsed(),
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }).catch(() => { })

        console.error('Error en API de Google Gemini:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
