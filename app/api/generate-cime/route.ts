import { NextRequest, NextResponse } from 'next/server'
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    console.log('API generate-cime: Iniciando request')
    
    const { prompt, maxTokens = 2000, temperature = 0.7 } = await request.json()
    console.log('API generate-cime: Datos recibidos:', { 
      promptLength: prompt?.length, 
      maxTokens, 
      temperature 
    })

    if (!prompt) {
      console.error('API generate-cime: Prompt no proporcionado')
      return NextResponse.json(
        { error: 'Prompt es requerido' },
        { status: 400 }
      )
    }

    console.log('API generate-cime: Llamando a Google Gemini...')
    
    // Usar el mismo patrón que proyectos/create con generateText
    const { text: geminiResponse } = await generateText({
      model: google("gemini-2.5-flash"),
        system: `Eres un pedagogo experto en la metodología CIME para la enseñanza de las matemáticas. Tu conocimiento se basa en el constructivismo y el uso de materiales concretos.

Genera planeaciones didácticas completas siguiendo estrictamente la secuencia de 3 etapas del método CIME: Etapa Concreta, Etapa de Registro y Etapa Formal.

IMPORTANTE: Genera el contenido en MARKDOWN estándar SIGUIENDO EXACTAMENTE este formato:

## Planeación Didáctica CIME: [Tema]

**Información General**

**Tema:** [Tema específico]
**Grado:** [Grado]° Grado de Primaria
**Metodología:** CIME (Constructivismo, Uso de Material Concreto)
**Duración Estimada:** [Duración]
**Objetivo General:** [Objetivo claro y específico]

**Aprendizajes Esperados**

- [Aprendizaje esperado 1]
- [Aprendizaje esperado 2]
- [Aprendizaje esperado 3]

**Conocimientos Previos Necesarios**

- [Conocimiento previo 1]
- [Conocimiento previo 2]

**Materiales Didácticos**

**Para el docente:** [Materiales del docente]
**Para el estudiante:** [Materiales del estudiante]

**1. ETAPA CONCRETA**

**Objetivo:** [Objetivo específico de la etapa]

**Actividad Detallada:**
[Descripción detallada de la actividad con material concreto]

**2. ETAPA DE REGISTRO**

**Objetivo:** [Objetivo específico de la etapa]

**Actividad Detallada:**
[Descripción detallada de la actividad de registro]

**3. ETAPA FORMAL**

**Objetivo:** [Objetivo específico de la etapa]

**Actividad Detallada:**
[Descripción detallada de la actividad formal]

**Evaluación Sugerida**
[Descripción de la evaluación]

NUNCA uses --- como separadores en el contenido. Usa solo doble salto de línea entre párrafos y secciones.`,
      prompt,
      temperature: temperature,
    })

    console.log('API generate-cime: Respuesta recibida, longitud:', geminiResponse?.length)

    if (!geminiResponse) {
      console.error('API generate-cime: Contenido vacío de Gemini')
      return NextResponse.json(
        { error: 'No se pudo generar el contenido' },
        { status: 500 }
      )
    }

    console.log('API generate-cime: Enviando respuesta exitosa')
    return NextResponse.json({
      success: true,
      content: geminiResponse,
    })

  } catch (error) {
    console.error('Error en API de Google Gemini:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
