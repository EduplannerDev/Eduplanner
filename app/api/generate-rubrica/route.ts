import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    // Capturar errores de parsing JSON
    let proyecto_id, titulo, tipo, pdas_seleccionados, criterios_personalizados;
    try {
      const body = await req.json();
      proyecto_id = body.proyecto_id;
      titulo = body.titulo;
      tipo = body.tipo;
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

    // 3. Construir el prompt para Gemini según el tipo de instrumento
    let prompt = '';
    
    if (tipo === 'lista_cotejo') {
      prompt = `
Rol: Actúa como un experto en evaluación, especializado en crear instrumentos prácticos y fáciles de usar.

Contexto: Estoy creando una Lista de Cotejo para el proyecto "${proyecto.nombre}" para el grado ${grupoInfo?.grado || 'no especificado'} de ${grupoInfo?.nivel || 'educación básica'}. Los aspectos a verificar, basados en PDAs y criterios personalizados, son los siguientes:

${pdasTextos.length > 0 ? `CRITERIOS BASADOS EN PDAs:
${pdasTextos.map((texto, index) => `${index + 1}. "${texto}"`).join("\n")}` : ''}

${criteriosPersonalizadosTextos.length > 0 ? `
CRITERIOS PERSONALIZADOS:
${criteriosPersonalizadosTextos.map((texto, index) => `${pdasTextos.length + index + 1}. "${texto}"`).join("\n")}` : ''}

Tarea: Tu tarea es tomar cada uno de los aspectos que te proporcioné y convertirlo en un indicador de logro claro, observable y binario (que se pueda responder con Sí/No). El resultado debe ser un objeto JSON que contenga un array de indicadores.

Formato de Salida Obligatorio: Tu respuesta debe ser únicamente un objeto JSON válido, con la siguiente estructura:

{
  "titulo_instrumento": "${titulo}",
  "tipo": "Lista de Cotejo",
  "indicadores": [
    {
      "indicador": "El ensayo presenta una introducción clara que expone el tema principal.",
      "criterio_origen": "PDA sobre textos argumentativos..."
    },
    {
      "indicador": "El trabajo incluye una portada con todos los datos solicitados (nombre, grado, fecha).",
      "criterio_origen": "Criterio personalizado: Incluye portada"
    },
    {
      "indicador": "Se utilizan correctamente las mayúsculas al inicio de cada oración y en nombres propios.",
      "criterio_origen": "PDA sobre reglas de ortografía..."
    }
  ]
}

IMPORTANTE: Asegúrate de que tu respuesta sea ÚNICAMENTE el objeto JSON válido, sin texto adicional, comentarios o explicaciones.
`;
    } else {
      // Prompt original para rúbrica analítica
      prompt = `
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
`;
    }

    // 4. Llamar a la API de Gemini
    const { text: geminiResponse } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
      temperature: 0.3,
    })

    // 5. Procesar la respuesta de Gemini
    let instrumentoJSON
    try {
      // Limpiar la respuesta de Gemini (remover markdown si existe)
      let cleanResponse = geminiResponse.trim()
      
      // Remover ```json y ``` si existen
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      instrumentoJSON = JSON.parse(cleanResponse)
      
      // Validar estructura según el tipo de instrumento
      if (tipo === 'lista_cotejo') {
        if (!instrumentoJSON.titulo_instrumento || !Array.isArray(instrumentoJSON.indicadores)) {
          throw new Error('Estructura de lista de cotejo inválida')
        }
      } else {
        if (!instrumentoJSON.titulo_rubrica || !Array.isArray(instrumentoJSON.criterios)) {
          throw new Error('Estructura de rúbrica inválida')
        }
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

    // Log para diagnosticar el problema
    console.log("Intentando insertar instrumento con datos:", {
      proyecto_id,
      user_id: proyecto.profesor_id,
      tipo: tipo || "rubrica_analitica",
      titulo: titulo || (tipo === 'lista_cotejo' ? instrumentoJSON.titulo_instrumento : instrumentoJSON.titulo_rubrica),
      estado: "borrador"
    })

    const { data: instrumento, error: instrumentoError } = await supabase
      .from("instrumentos_evaluacion")
      .insert({
        proyecto_id,
        user_id: proyecto.profesor_id,
        tipo: tipo || "rubrica_analitica",
        titulo: titulo || (tipo === 'lista_cotejo' ? instrumentoJSON.titulo_instrumento : instrumentoJSON.titulo_rubrica),
        contenido: instrumentoJSON,
        estado: "borrador"
      })
      .select()
      .single()

    if (instrumentoError) {
      console.error("Error al guardar el instrumento:", instrumentoError)
      
      // Manejo específico del error PGRST204 (columna no encontrada en caché del esquema)
      if (instrumentoError.code === 'PGRST204') {
        console.error("Error PGRST204: Problema con el caché del esquema de Supabase")
        console.error("Esto puede indicar que las migraciones no se han aplicado correctamente o hay un problema de sincronización")
        
        // Intentar verificar la estructura de la tabla
        const { data: tableInfo, error: tableError } = await supabase
          .from("instrumentos_evaluacion")
          .select("*")
          .limit(1)
        
        if (tableError) {
          console.error("Error al verificar la tabla instrumentos_evaluacion:", tableError)
        } else {
          console.log("La tabla instrumentos_evaluacion existe y es accesible")
        }
        
        // Intentar una estrategia de respaldo: insertar sin user_id y luego actualizarlo
        console.log("Intentando estrategia de respaldo sin user_id...")
        
        try {
          const { data: instrumentoRespaldo, error: errorRespaldo } = await supabase
            .from("instrumentos_evaluacion")
            .insert({
              proyecto_id,
              tipo: tipo || "rubrica_analitica",
              titulo: titulo || (tipo === 'lista_cotejo' ? instrumentoJSON.titulo_instrumento : instrumentoJSON.titulo_rubrica),
              contenido: instrumentoJSON,
              estado: "borrador"
            })
            .select()
            .single()
          
          if (errorRespaldo) {
            console.error("Error en estrategia de respaldo:", errorRespaldo)
            return NextResponse.json(
              { 
                error: "Error de esquema de base de datos. Por favor, contacta al administrador.",
                details: "No se pudo insertar el instrumento usando métodos alternativos."
              },
              { status: 500 }
            )
          }
          
          // Si la inserción fue exitosa, intentar actualizar con user_id
          if (instrumentoRespaldo) {
            const { error: updateError } = await supabase
              .from("instrumentos_evaluacion")
              .update({ user_id: proyecto.profesor_id })
              .eq('id', instrumentoRespaldo.id)
            
            if (updateError) {
              console.error("Error actualizando user_id:", updateError)
              // Continuar sin user_id si es necesario
            }
            
            console.log("Instrumento insertado exitosamente usando estrategia de respaldo")
            // Usar instrumentoRespaldo como instrumento para continuar
            instrumento = instrumentoRespaldo
          }
          
        } catch (respaldoError) {
          console.error("Error en estrategia de respaldo:", respaldoError)
          return NextResponse.json(
            { 
              error: "Error de esquema de base de datos. Por favor, contacta al administrador.",
              details: "La columna 'user_id' no se encuentra en el esquema. Esto puede indicar un problema de sincronización con la base de datos."
            },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: "Error al guardar el instrumento en la base de datos" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      instrumento_id: instrumento.id,
      instrumento: instrumentoJSON
    })
    
  } catch (error) {
    console.error("Error al generar rúbrica:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}