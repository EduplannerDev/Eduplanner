import { google } from "@ai-sdk/google"
import { streamText, embed } from "ai"
import { createServiceClient } from "@/lib/supabase"
import fs from "fs"
import { logAIUsage, createTimer } from '@/lib/ai-usage-tracker'

export const maxDuration = 30

export async function POST(req: Request) {
    const timer = createTimer()

    try {
        const { messages, userId } = await req.json()

        // Obtener el último mensaje del usuario
        const lastMessage = messages[messages.length - 1]
        const userQuery = lastMessage.content

        // Inicializar Supabase con service role para saltar RLS
        const supabase = createServiceClient()

        // 1. Generar embedding de la consulta
        console.log("Generando embedding para:", userQuery);
        const { embedding } = await embed({
            model: google.textEmbeddingModel("text-embedding-004"),
            value: userQuery,
        })

        // 2. Buscar documentación relevante (RAG)
        console.log("Buscando documentación...");
        const { data: documents, error } = await supabase.rpc('search_documentation_by_similarity', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 10
        })

        if (error) {
            console.error("Error buscando documentación:", error)
        }

        // 3. Preparar el contexto
        let contextText = ""
        if (documents && documents.length > 0) {
            console.log(`Documentos encontrados: ${documents.length}`);
            contextText = documents.map((doc: any) =>
                `-- DOCUMENTO: ${doc.title} (${doc.module_name}/${doc.flow_type}) --\n${doc.section_content || doc.content}`
            ).join('\n\n')
        } else {
            console.log("No se encontraron documentos.");
            contextText = "No se encontró documentación específica para esta consulta."
        }

        // 4. Generar respuesta con Gemini
        const result = await streamText({
            model: google("gemini-2.5-flash"),
            system: `Eres EduPlanner Bot, el asistente de ayuda oficial de la plataforma EduPlanner.
      
      TU OBJETIVO:
      Ayudar a los usuarios (profesores y directores) a utilizar la plataforma EduPlanner, resolviendo dudas sobre cómo crear planeaciones, exámenes, proyectos, dosificaciones y otras funcionalidades.
      
      CONTEXTO DE DOCUMENTACIÓN (RAG):
      Utiliza la siguiente información recuperada de la documentación oficial para responder:
      
      ${contextText}
      
      INSTRUCCIONES:
      1. Basa tus respuestas PRINCIPALMENTE en la documentación proporcionada arriba.
      2. Si la documentación contiene la respuesta, explícala paso a paso con claridad.
      3. Si la documentación NO menciona el tema exacto, pero tienes conocimiento general educativo que sea útil y seguro, úsalo para orientar al usuario, aclarando que es una respuesta basada en prácticas generales y no necesariamente detallada en la documentación actual.
      3b. Si la pregunta es sobre una funcionalidad específica de la plataforma (como "dónde está el botón X") y NO tienes esa información en el contexto, di amablemente que no puedes ubicar esa función específica en este momento.
      4. Sé amable, paciente y didáctico.
      5. Responde siempre en Español de México.
      6. TU NOMBRE ES EDU. Si te preguntan "¿Quién eres?", responde siempre: "Soy Edu, la mascota y asistente virtual de EduPlanner 🤖". Nunca digas que eres un "modelo de lenguaje" o "EduPlanner Bot". ¡Tienes personalidad!
      7. Usa emojis ocasionalmente para ser más amigable.
      8. Usa formato Markdown para listas, negritas y enlaces si es necesario.
      
      INFORMACIÓN IMPORTANTE SOBRE EL PLAN PRO:
      - El Plan Pro cuesta $200 MXN al mes.
      - Incluye: Planeaciones, exámenes, grupos y proyectos ILIMITADOS. Además: IA para planeaciones, Plan Analítico, descargas en Word editable y soporte prioritario.
      - Para contratar: El usuario debe ir a la sección "Suscripción" (o hacer clic en el botón de corona/trofeo si está visible en la interfaz) y seleccionar "Actualizar a PRO". El pago es seguro a través de Stripe.

      RESTRICCIONES:
      - No inventes funcionalidades que no aparecen en el contexto.
      - No des información técnica interna (código, base de datos).
      `,
            messages,
            onFinish: async ({ text, usage }) => {
                // Log AI usage for analytics
                logAIUsage({
                    userId: userId,
                    endpoint: '/api/chat-help',
                    inputTokens: usage?.promptTokens,
                    outputTokens: usage?.completionTokens,
                    latencyMs: timer.elapsed(),
                    success: true,
                    metadata: { hasContext: documents?.length > 0 }
                }).catch(() => { })

                try {
                    // Registrar la conversación en la base de datos
                    await supabase.from('help_chat_logs').insert({
                        user_id: userId || null, // Puede ser null si no vino el ID
                        question: userQuery,
                        answer: text,
                        metadata: {
                            context_docs: documents?.map((d: any) => d.title) || []
                        }
                    })
                } catch (logError) {
                    console.error("Error logging help chat:", logError)
                }
            },
        })

        return result.toDataStreamResponse()
    } catch (error) {
        logAIUsage({
            endpoint: '/api/chat-help',
            latencyMs: timer.elapsed(),
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }).catch(() => { })

        console.error("Error en API chat-help:", error)
        return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, { status: 500 })
    }
}
