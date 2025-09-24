import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    // Capturar errores de parsing JSON
    let proyecto_id, titulo, tipo, descripcion, pdas_seleccionados, criterios_personalizados;
    try {
      const body = await req.json();
      proyecto_id = body.proyecto_id;
      titulo = body.titulo;
      tipo = body.tipo;
      descripcion = body.descripcion;
      pdas_seleccionados = body.pdas_seleccionados || [];
      criterios_personalizados = body.criterios_personalizados || [];
    } catch (error) {
      console.error("Error al parsear el cuerpo de la solicitud:", error);
      return NextResponse.json(
        { error: "Formato de solicitud inválido" },
        { status: 400 }
      );
    }
    
    if (!proyecto_id) {
      return NextResponse.json(
        { error: "Se requiere el ID del proyecto" },
        { status: 400 }
      )
    }

    if (!titulo || titulo.trim() === '') {
      return NextResponse.json(
        { error: "Se requiere el título del instrumento" },
        { status: 400 }
      )
    }

    if (!pdas_seleccionados || pdas_seleccionados.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un PDA seleccionado" },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase con credenciales de servicio para evitar RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Intentar obtener todos los proyectos para depuración
    const { data: todosProyectos, error: errorTodos } = await supabase
      .from("proyectos")
      .select("id")
      .limit(5)
    
    console.log("Muestra de proyectos disponibles:", { 
      count: todosProyectos?.length || 0, 
      ejemplos: todosProyectos?.map(p => p.id).slice(0, 3) || [],
      error: errorTodos
    })

    // Usar una consulta SQL directa para evitar problemas con RLS
    const { data: proyectoData, error: proyectoError } = await supabase
      .from('proyectos')
      .select(`
        id, 
        nombre,
        grupo_id,
        profesor_id
      `)
      .eq('id', proyecto_id)
      .limit(1)
    
    // Verificar si se encontró el proyecto
    if (proyectoError || !proyectoData || proyectoData.length === 0) {
      console.error("Error al obtener el proyecto:", proyectoError)
      console.log("Datos del proyecto:", proyectoData)
      
      return NextResponse.json(
        { 
          error: "Proyecto no encontrado", 
          details: proyectoError?.message || "No se encontró el proyecto con el ID proporcionado",
          id: proyecto_id
        },
        { status: 404 }
      )
    }
    
    // Usar el primer resultado
    const proyecto = proyectoData[0]
    console.log("Proyecto encontrado:", proyecto.id, proyecto.nombre)
    console.log("Profesor ID del proyecto:", proyecto.profesor_id)
    
    // Obtener información del grupo
    let grupoInfo = null
    if (proyecto.grupo_id) {
      const { data: grupo } = await supabase
        .from("grupos")
        .select("nombre, grado, nivel")
        .eq("id", proyecto.grupo_id)
        .single()
        
      if (grupo) {
        grupoInfo = grupo
        console.log("Grupo encontrado:", grupo.nombre, grupo.grado, grupo.nivel)
      }
    }

    // 2. Obtener información de los PDAs seleccionados
    const { data: pdasData, error: pdasError } = await supabase
      .from("curriculo_sep")
      .select(`
        id,
        pda,
        contenido,
        campo_formativo,
        grado
      `)
      .in("id", pdas_seleccionados)

    if (pdasError) {
      console.error("Error al obtener PDAs:", pdasError)
      return NextResponse.json(
        { error: "Error al obtener información de los PDAs seleccionados" },
        { status: 500 }
      )
    }

    // Extraer textos de PDAs seleccionados
    const pdasTextos = pdasData
      .map((item) => item.pda)
      .filter(Boolean)

    // Agregar criterios personalizados si existen
    const criteriosPersonalizadosTextos = criterios_personalizados || []

    // Combinar PDAs y criterios personalizados
    const todosCriterios = [...pdasTextos, ...criteriosPersonalizadosTextos]

    if (todosCriterios.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un criterio (PDA o personalizado)" },
        { status: 400 }
      )
    }

    // 3. Construir el prompt para Gemini
    const prompt = `
Rol: Actúa como un experto en evaluación formativa y pedagogía, alineado con la Nueva Escuela Mexicana. Eres un especialista en crear instrumentos de evaluación claros y objetivos.

Contexto: Estoy creando una rúbrica analítica para evaluar un proyecto llamado "${proyecto.nombre}" para el grado ${grupoInfo?.grado || 'no especificado'} de ${grupoInfo?.nivel || 'educación básica'}. Los criterios de evaluación que se deben incluir en esta rúbrica son los siguientes:

${pdasTextos.length > 0 ? `CRITERIOS BASADOS EN PDAs:
${pdasTextos.map((texto, index) => `${index + 1}. "${texto}"`).join("\n")}` : ''}

${criteriosPersonalizadosTextos.length > 0 ? `
CRITERIOS PERSONALIZADOS:
${criteriosPersonalizadosTextos.map((texto, index) => `${pdasTextos.length + index + 1}. "${texto}"`).join("\n")}` : ''}

Tarea: Tu tarea es generar una rúbrica completa en formato JSON. Para cada criterio que te proporcioné (ya sea basado en PDA o personalizado), crea un "criterio" de evaluación claro y conciso. Luego, para cada criterio, escribe un "descriptor" de desempeño observable y específico para cada uno de los siguientes cuatro niveles de logro: Sobresaliente, Logrado, En Proceso, y Requiere Apoyo.

Formato de Salida Obligatorio: Tu respuesta debe ser únicamente un objeto JSON válido, con la siguiente estructura:

{
  "titulo_rubrica": "Rúbrica para el Proyecto '[Nombre del Proyecto]'",
  "criterios": [
    {
      "criterio": "Calidad de la Entrevista y Registro de Información",
      "pda_origen": "[Texto del PDA de Lenguajes...]",
      "descriptores": {
        "Sobresaliente": "Formula preguntas originales y profundas que van más allá de lo evidente. El registro de la entrevista es detallado, organizado y captura matices importantes.",
        "Logrado": "Formula preguntas adecuadas y pertinentes para el tema. El registro de la entrevista es claro y contiene la información principal.",
        "En Proceso": "Formula preguntas básicas, pero a veces se desvía del tema. El registro es simple y omite algunos detalles.",
        "Requiere Apoyo": "Se le dificulta formular preguntas sin ayuda. El registro de la entrevista es incompleto o difícil de entender."
      }
    }
  ]
}

IMPORTANTE: Asegúrate de que tu respuesta sea ÚNICAMENTE el objeto JSON válido, sin texto adicional, comentarios o explicaciones.
`

    // 4. Llamar a la API de Gemini
    const { text: geminiResponse } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
      temperature: 0.3,
    })

    // 5. Procesar la respuesta de Gemini
    let rubricaJSON
    try {
      // Limpiar la respuesta de Gemini (remover markdown si existe)
      let cleanResponse = geminiResponse.trim()
      
      // Remover ```json y ``` si existen
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      rubricaJSON = JSON.parse(cleanResponse)
      
      // Validar estructura básica
      if (!rubricaJSON.titulo_rubrica || !Array.isArray(rubricaJSON.criterios)) {
        throw new Error('Estructura de rúbrica inválida')
      }
      
    } catch (parseError) {
      console.error('Error parseando respuesta de Gemini:', parseError)
      console.error('Respuesta recibida:', geminiResponse)
      return NextResponse.json(
        { error: 'Error procesando respuesta de la IA' },
        { status: 500 }
      )
    }

    // 6. Guardar la rúbrica en la base de datos
    if (!proyecto.profesor_id) {
      console.error("El proyecto no tiene profesor_id asignado")
      return NextResponse.json(
        { error: "El proyecto no tiene un profesor asignado" },
        { status: 400 }
      )
    }

    const { data: rubrica, error: rubricaError } = await supabase
      .from("instrumentos_evaluacion")
      .insert({
        proyecto_id,
        user_id: proyecto.profesor_id,
        tipo: tipo || "rubrica_analitica",
        titulo: titulo || rubricaJSON.titulo_rubrica,
        contenido: rubricaJSON,
        estado: "borrador"
      })
      .select()
      .single()

    if (rubricaError) {
      console.error("Error al guardar la rúbrica:", rubricaError)
      return NextResponse.json(
        { error: "Error al guardar la rúbrica en la base de datos" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rubrica_id: rubrica.id,
      rubrica: rubricaJSON
    })
    
  } catch (error) {
    console.error("Error al generar rúbrica:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}