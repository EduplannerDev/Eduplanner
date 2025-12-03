import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { comunitario, escolar, grupo, grado } = await req.json()

        if (!comunitario || !escolar || !grupo) {
            return NextResponse.json(
                { error: 'Faltan datos de contexto' },
                { status: 400 }
            )
        }

        const prompt = `
      Actúa como un experto pedagogo de la Nueva Escuela Mexicana (NEM).
      
      Tu tarea es redactar un "Diagnóstico Socioeducativo" profesional y coherente para el Plan Analítico de un grupo de ${grado}° grado.
      
      Utiliza la siguiente información proporcionada por el docente:
      
      1. Contexto Comunitario:
      ${comunitario}
      
      2. Contexto Escolar:
      ${escolar}
      
      3. Contexto del Grupo (Alumnos):
      ${grupo}
      
      Instrucciones de redacción:
      - Integra los tres ámbitos en una narrativa fluida y profesional.
      - Utiliza terminología pedagógica adecuada a la NEM.
      - Enfócate en cómo estos factores influyen en el aprendizaje.
      - Sé conciso pero completo (aprox. 200-300 palabras).
      - No uses viñetas, redacta en párrafos.
      - El tono debe ser formal y reflexivo.
    `

        const result = await generateText({
            model: google('gemini-2.5-flash'),
            prompt: prompt,
        })

        return NextResponse.json({ diagnostico: result.text })
    } catch (error) {
        console.error('Error generando diagnóstico:', error)
        return NextResponse.json(
            { error: 'Error al generar el diagnóstico' },
            { status: 500 }
        )
    }
}
