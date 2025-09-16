import { NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  try {
    const { originalMessage } = await req.json()

    if (!originalMessage) {
      return NextResponse.json(
        { error: "Mensaje original requerido" },
        { status: 400 }
      )
    }

    const prompt = `### ROL ###
Actúa como un asistente de comunicación educativa, experto en sintetizar información para diferentes canales.

### CONTEXTO ###
He redactado un correo electrónico formal y detallado para los padres de familia de mis alumnos. A continuación, te proporciono ese correo.

**Correo Original:**
${originalMessage}

### TAREA ###
Tu única tarea es generar un resumen muy breve y accionable del "Correo Original", optimizado para ser enviado por WhatsApp.

### PENSAMIENTO PASO A PASO (OBLIGATORIO) ###
Para asegurar la calidad, debes seguir estos pasos en orden:
1. **Analiza el "Correo Original"**: Lee el correo e identifica un máximo de 3 datos que sean absolutamente CLAVE. Un dato clave es una fecha, una acción requerida (ej. "traer un material") o el tema central del comunicado.
2. **Redacta el Resumen**: Escribe un borrador del resumen que contenga ÚNICAMENTE los datos clave que identificaste. Usa un formato de lista corta (con guiones o viñetas) para que sea fácil de leer.
3. **Aplica el Tono**: Revisa el borrador y ajústalo para que tenga un tono cercano y amigable. Puedes usar un emoji profesional y relevante (como 👋, ✨, 🗓️, 📢).
4. **Añade la Nota Final**: **SOLO AL FINAL**, añade una frase corta e independiente para que consulten el correo para más detalles. Por ejemplo: "Los detalles completos están en el correo."

### FORMATO DE SALIDA OBLIGATORIO ###
Tu respuesta final debe ser únicamente un objeto JSON válido, sin ningún texto adicional antes o después. La estructura del JSON debe ser la siguiente:
{
  "resumen_whatsapp": "AQUÍ VA EL TEXTO DEL MENSAJE RESUMIDO Y FORMATEADO"
}

### REGLAS ADICIONALES (MUY IMPORTANTE) ###
- **REGLA PRINCIPAL:** El propósito del mensaje **NO ES** avisar que se envió un correo. El propósito es **RESUMIR** los puntos clave. La mención al correo es secundaria.`

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
      temperature: 0.7,
      maxTokens: 200,
    })

    // Intentar parsear el JSON de la respuesta de la IA
    let adaptedMessage = text.trim()
    
    // Limpiar bloques de código markdown si existen
    let cleanedText = adaptedMessage
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    try {
      const jsonResponse = JSON.parse(cleanedText)
      if (jsonResponse.resumen_whatsapp) {
        adaptedMessage = jsonResponse.resumen_whatsapp
      }
    } catch (parseError) {

      // Si no se puede parsear como JSON, usar el texto tal como está
    }

    return NextResponse.json({
      adaptedMessage: adaptedMessage,
    })
  } catch (error) {
    console.error("Error al adaptar mensaje para WhatsApp:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}