'use server'

import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const fichaSchema = z.object({
    logros: z.string().describe("Redacción pedagógica de los logros y fortalezas del alumno."),
    dificultades: z.string().describe("Redacción pedagógica de las dificultades o áreas de oportunidad."),
    recomendaciones: z.string().describe("Sugerencias prácticas y concretas para la intervención docente y familiar.")
})

export async function generateFichaContent(
    inputData: {
        nombre: string,
        grado: string,
        observacionesLogros: string,
        observacionesDificultades: string,
        observacionesRecomendaciones: string
    }
) {
    try {
        const prompt = `
      Eres un experto pedagogo de la SEP (Secretaría de Educación Pública) de México.
      Tu tarea es redactar el contenido cualitativo de una Ficha Descriptiva del Alumno.
      
      DATOS DEL ALUMNO:
      - Nombre: ${inputData.nombre}
      - Grado: ${inputData.grado}
      
      Tus instrucciones:
      1. Transforma las notas coloquiales del docente en un texto formal, empático, constructivo y con lenguaje pedagógico adecuado.
      2. NO inventes información, solo elabora y profesionaliza lo que el docente proporcionó.
      3. Sé conciso pero claro.
      
      INPUTS DEL DOCENTE:
      - Notas sobre Logros: "${inputData.observacionesLogros}"
      - Notas sobre Dificultades: "${inputData.observacionesDificultades}"
      - Notas sobre Recomendaciones: "${inputData.observacionesRecomendaciones}"
      
      Genera el objeto JSON con los campos redactados.
    `

        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: fichaSchema,
            prompt: prompt,
        })

        return { success: true, data: object }
    } catch (error) {
        console.error("Error generating ficha content:", error)
        return { success: false, error: "Error al generar el contenido con IA." }
    }
}
