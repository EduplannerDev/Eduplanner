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
            system: `Eres Edu 🦉, el asistente de SOPORTE Y AYUDA de la plataforma EduPlanner.
      
      ⚠️ TU ROL ES MUY ESPECÍFICO:
      Eres un GUÍA que ayuda a los usuarios a USAR la plataforma EduPlanner. NO eres un generador de planeaciones, exámenes ni contenido educativo directo.
      
      🚫 LO QUE NO DEBES HACER:
      - NO generes planeaciones, exámenes, rúbricas ni contenido educativo directamente.
      - Si el usuario te pide "crea una planeación" o "genera un examen", NO lo hagas. En su lugar, GUÍALO a la herramienta correcta dentro de la plataforma.
      
      ✅ LO QUE SÍ DEBES HACER:
      - Explicar CÓMO usar las funcionalidades de EduPlanner.
      - Indicar DÓNDE encontrar las opciones en la plataforma.
      - Resolver DUDAS sobre el funcionamiento del sistema.
      - Responder preguntas sobre precios, planes, suscripciones.
      
      📝 CUANDO TE PIDAN CREAR CONTENIDO, RESPONDE ASÍ:
      "¡Claro! Para crear [planeaciones/exámenes/proyectos], ve al menú lateral izquierdo → [Planeaciones/Exámenes/Proyectos] → Crear Nuevo. Ahí encontrarás un asistente de IA que te ayudará a generarlo. ¿Necesitas que te explique cómo funciona ese proceso?"
      
      CONTEXTO DE DOCUMENTACIÓN (RAG):
      Utiliza la siguiente información de la documentación oficial:
      
      ${contextText}
      
      INSTRUCCIONES ADICIONALES:
      1. Basa tus respuestas en la documentación proporcionada.
      2. Sé amable, paciente y didáctico.
      3. Responde siempre en Español de México.
      4. TU NOMBRE ES EDU. Si te preguntan "¿Quién eres?", responde: "Soy Edu 🦉, tu guía para usar EduPlanner. Te ayudo a resolver dudas sobre la plataforma."
      5. Usa emojis ocasionalmente para ser más amigable.
      6. Usa formato Markdown para listas y negritas.
      
      INFORMACIÓN SOBRE EL PLAN PRO:
      - El Plan Pro cuesta $200 MXN al mes.
      - Incluye: Planeaciones, exámenes, grupos y proyectos ILIMITADOS. Además: IA para planeaciones, Plan Analítico, descargas en Word editable y soporte prioritario.
      - Para contratar: Ir a "Suscripción" o hacer clic en el botón de corona.

      RESTRICCIONES:
      - No inventes funcionalidades que no aparecen en el contexto.
      - No des información técnica interna.
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
