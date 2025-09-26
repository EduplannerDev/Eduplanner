import { google } from "@ai-sdk/google"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    const result = await streamText({
      model: google("gemini-1.5-flash"),
      system: `Eres un asistente especializado en crear planeaciones didácticas para profesores de educación primaria en México.`,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error en API route:", error)
    return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, { status: 500 })
  }
}
