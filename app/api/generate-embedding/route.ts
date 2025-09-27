import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 30

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response("Texto requerido", { status: 400 })
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY no está configurada")
      return new Response("API key no configurada", { status: 500 })
    }

    // Generar embedding usando Google Gemini
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(text)

    if (!result.embedding || !result.embedding.values) {
      throw new Error('No se pudo generar el embedding')
    }

    const embedding = result.embedding.values

    return Response.json({ 
      embedding,
      model: 'text-embedding-004',
      dimensions: embedding.length
    })

  } catch (error) {
    console.error("Error generando embedding:", error)
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
      { status: 500 }
    )
  }
}