import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!

interface CreateProyectoRequest {
  nombre: string
  problematica: string
  producto_final: string
  metodologia_nem: string
  grupo_id: string
  pdas_seleccionados: string[]
}

interface ProyectoFase {
  fase: string
  momento: string
  contenido_generado: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 [PROYECTO] Iniciando creación de proyecto')
  
  try {
    // Validar configuración
    if (!GOOGLE_API_KEY) {
      console.error('❌ [PROYECTO] Configuración de API incompleta - GOOGLE_API_KEY faltante')
      return NextResponse.json(
        { error: 'Configuración de API incompleta' },
        { status: 500 }
      )
    }
    
    console.log('✅ [PROYECTO] Configuración de API validada')

    let user: any = null
    let supabase: SupabaseClient | null = null
    
    console.log('🔐 [PROYECTO] Iniciando proceso de autenticación')
    
    // Intentar autenticación con Bearer token primero
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      console.log('🔑 [PROYECTO] Usando autenticación Bearer token')
      const token = authHeader.split(' ')[1]
      
      // Crear cliente con service role para verificar token
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: { user: tokenUser }, error: tokenError } = await serviceSupabase.auth.getUser(token)
      
      if (!tokenError && tokenUser) {
        user = tokenUser
        supabase = serviceSupabase
        console.log('✅ [PROYECTO] Autenticación Bearer exitosa para usuario:', user.id)
      } else {
        console.log('⚠️ [PROYECTO] Error en autenticación Bearer:', tokenError?.message)
      }
    }
    
    // Si no hay Bearer token o falló, intentar con cookies
    if (!user) {
      console.log('🍪 [PROYECTO] Intentando autenticación con cookies')
      const cookieStore = await cookies()
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      })
      
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !cookieUser) {
        console.error('❌ [PROYECTO] Error en autenticación con cookies:', authError?.message)
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
      
      user = cookieUser
      console.log('✅ [PROYECTO] Autenticación con cookies exitosa para usuario:', user.id)
    }

    console.log('📝 [PROYECTO] Parseando datos del request')
    const {
      nombre,
      problematica,
      producto_final,
      metodologia_nem,
      grupo_id,
      pdas_seleccionados
    }: CreateProyectoRequest = await request.json()

    console.log('📋 [PROYECTO] Datos recibidos:', {
      nombre,
      metodologia_nem,
      grupo_id,
      pdas_count: pdas_seleccionados?.length || 0
    })

    // Validar datos requeridos
    if (!nombre || !problematica || !producto_final || !metodologia_nem || !grupo_id) {
      console.error('❌ [PROYECTO] Faltan datos obligatorios del proyecto')
      return NextResponse.json(
        { error: 'Faltan datos obligatorios del proyecto' },
        { status: 400 }
      )
    }

    if (!pdas_seleccionados || pdas_seleccionados.length === 0) {
      console.error('❌ [PROYECTO] No se seleccionaron PDAs')
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un PDA' },
        { status: 400 }
      )
    }

    console.log('✅ [PROYECTO] Validación de datos exitosa')


    // PASO 2: Guardar el Proyecto Base
    console.log('💾 [PROYECTO] Guardando proyecto base en base de datos')
    const proyectoStartTime = Date.now()
    
    const { data: proyecto, error: proyectoError } = await supabase
      .from('proyectos')
      .insert({
        profesor_id: user.id, // Usar el ID del usuario autenticado
        grupo_id,
        nombre,
        problematica,
        producto_final,
        metodologia_nem,
        estado: 'activo'
      })
      .select()
      .single()

    const proyectoTime = Date.now() - proyectoStartTime
    console.log(`⏱️ [PROYECTO] Tiempo guardando proyecto: ${proyectoTime}ms`)

    if (proyectoError) {
      console.error('❌ [PROYECTO] Error creando proyecto:', proyectoError)
      return NextResponse.json(
        { error: `Error creando proyecto: ${proyectoError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ [PROYECTO] Proyecto base creado exitosamente con ID:', proyecto.id)


    // PASO 3: Obtener el ID del Nuevo Proyecto
    const proyectoId = proyecto.id

    // PASO 4: Vincular el Currículo
    console.log('🔗 [PROYECTO] Creando relaciones con PDAs seleccionados')
    const relacionesStartTime = Date.now()
    
    const relaciones = pdas_seleccionados.map(pdaId => ({
      proyecto_id: proyectoId,
      curriculo_id: pdaId
    }))

    const { error: relacionesError } = await supabase
      .from('proyecto_curriculo')
      .insert(relaciones)

    const relacionesTime = Date.now() - relacionesStartTime
    console.log(`⏱️ [PROYECTO] Tiempo creando relaciones: ${relacionesTime}ms`)

    if (relacionesError) {
      // Si falla la inserción de relaciones, eliminar el proyecto creado
      console.log('🧹 [PROYECTO] Limpiando proyecto creado debido a error en relaciones')
      await supabase
        .from('proyectos')
        .delete()
        .eq('id', proyectoId)
      
      console.error('❌ [PROYECTO] Error creando relaciones:', relacionesError)
      return NextResponse.json(
        { error: `Error creando relaciones con PDAs: ${relacionesError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ [PROYECTO] Relaciones con PDAs creadas exitosamente')


    // PASO 5: Construir el Prompt Detallado para Gemini
    console.log('📊 [PROYECTO] Obteniendo información del grupo y PDAs')
    const dataStartTime = Date.now()
    
    // Primero, obtener información del grupo
    const { data: grupo, error: grupoError } = await supabase
      .from('grupos')
      .select('grado, nivel')
      .eq('id', grupo_id)
      .single()

    if (grupoError) {
      console.error('❌ [PROYECTO] Error obteniendo información del grupo:', grupoError)
      return NextResponse.json(
        { error: `Error obteniendo información del grupo: ${grupoError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ [PROYECTO] Información del grupo obtenida:', { grado: grupo.grado, nivel: grupo.nivel })

    // Obtener los PDAs seleccionados con su contenido completo
    const { data: pdasData, error: pdasError } = await supabase
      .from('curriculo_sep')
      .select('contenido, pda, campo_formativo')
      .in('id', pdas_seleccionados)

    if (pdasError) {
      console.error('❌ [PROYECTO] Error obteniendo PDAs:', pdasError)
      return NextResponse.json(
        { error: `Error obteniendo PDAs: ${pdasError.message}` },
        { status: 500 }
      )
    }

    const dataTime = Date.now() - dataStartTime
    console.log(`⏱️ [PROYECTO] Tiempo obteniendo datos: ${dataTime}ms`)
    console.log('✅ [PROYECTO] PDAs obtenidos:', pdasData.length, 'elementos')

    // Construir el prompt
    console.log('📝 [PROYECTO] Construyendo prompt para IA')
    const promptStartTime = Date.now()
    
    const pdasText = pdasData.map(pda => 
      `- "${pda.contenido}" (PDA: ${pda.pda})`
    ).join('\n')

    const prompt = `### ROL ###
Actúa como un diseñador instruccional experto y un pedagogo creativo, especializado en la Nueva Escuela Mexicana y en la metodología de ${metodologia_nem}.

### CONTEXTO ###
Estoy diseñando un proyecto educativo para un grupo de ${grupo.grado}° Grado de ${grupo.nivel}.
- Título del Proyecto: "${nombre}"
- Problemática Central: "${problematica}"
- Producto Final Esperado: "${producto_final}"
- Procesos de Desarrollo de Aprendizaje (PDAs) a cubrir:
${pdasText}

### TAREA ###
Tu tarea es generar una secuencia de actividades detallada, creativa y coherente para cada Fase y Momento de la metodología "${metodologia_nem}". Las actividades deben estar directamente relacionadas con la problemática, los PDAs y el producto final. El lenguaje debe ser claro para un profesor.

### FORMATO DE SALIDA OBLIGATORIO ###
Tu respuesta debe ser únicamente un objeto JSON válido, sin ningún texto introductorio como "Claro, aquí tienes...". El JSON debe ser un array de objetos. Cada objeto debe representar un "Momento" de la metodología y tener exactamente las siguientes claves: "fase", "momento" y "contenido_generado".

Ejemplo de la estructura de tu respuesta:
[
  {
    "fase": "Fase 1: Planeación",
    "momento": "Momento 1: Identificación",
    "contenido_generado": "Para este momento, se sugiere iniciar con una lluvia de ideas donde los alumnos expresen qué entienden por la problemática de '${problematica}'. Utiliza preguntas detonadoras como..."
  },
  {
    "fase": "Fase 1: Planeación",
    "momento": "Momento 2: Recuperación",
    "contenido_generado": "Realizar una actividad donde los alumnos dibujen o escriban en su cuaderno lo que ya saben sobre cómo se maneja la basura en su comunidad. Esto conectará con el PDA: '${pdasData[0]?.contenido}'."
  }
]`

    const promptTime = Date.now() - promptStartTime
    console.log(`⏱️ [PROYECTO] Tiempo construyendo prompt: ${promptTime}ms`)
    console.log('✅ [PROYECTO] Prompt construido, longitud:', prompt.length, 'caracteres')


    // PASO 6: Ejecutar la IA
    console.log('🤖 [PROYECTO] Enviando prompt a Gemini AI')
    const aiStartTime = Date.now()
    
    const { text: geminiResponse } = await generateText({
        model: google("gemini-2.5-flash"),
      prompt,
      temperature: 0.7,
    })

    const aiTime = Date.now() - aiStartTime
    console.log(`⏱️ [PROYECTO] Tiempo de respuesta de IA: ${aiTime}ms`)
    console.log('✅ [PROYECTO] Respuesta de IA recibida, longitud:', geminiResponse.length, 'caracteres')


    // PASO 7: Procesar la Respuesta de la IA
    console.log('🔄 [PROYECTO] Procesando respuesta de IA')
    const parseStartTime = Date.now()
    
    let fasesGeneradas: ProyectoFase[]
    let cleanResponse: string = '' // Declarar cleanResponse fuera del try
    let parseTime: number = 0 // Declarar parseTime fuera del try
    
    try {
      
      // Limpiar la respuesta de Gemini (remover markdown si existe)
      cleanResponse = geminiResponse.trim()
      
      // Función para extraer JSON válido de la respuesta
      function extractJSON(response: string): string {
        // Buscar el primer [ y el último ] para extraer el array JSON
        const firstBracket = response.indexOf('[')
        const lastBracket = response.lastIndexOf(']')
        
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          return response.substring(firstBracket, lastBracket + 1)
        }
        
        // Si no encuentra brackets, intentar limpiar markdown
        if (response.startsWith('```json')) {
          response = response.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (response.startsWith('```')) {
          response = response.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        return response
      }
      
      cleanResponse = extractJSON(cleanResponse)
      
      fasesGeneradas = JSON.parse(cleanResponse)
      
      if (!Array.isArray(fasesGeneradas)) {
        throw new Error('La respuesta no es un array')
      }

      // Validar estructura de cada elemento
      for (const fase of fasesGeneradas) {
        if (!fase.fase || !fase.momento || !fase.contenido_generado) {
          throw new Error(`Estructura de fase inválida: ${JSON.stringify(fase)}`)
        }
      }
      
      parseTime = Date.now() - parseStartTime
      console.log(`⏱️ [PROYECTO] Tiempo procesando respuesta: ${parseTime}ms`)
      console.log('✅ [PROYECTO] Respuesta procesada exitosamente, fases generadas:', fasesGeneradas.length)
      
    } catch (parseError) {
      console.error('❌ [PROYECTO] Error parseando respuesta de Gemini:', parseError)
      console.error('📝 [PROYECTO] Respuesta completa:', geminiResponse.substring(0, 1000) + (geminiResponse.length > 1000 ? '...(truncated)' : ''))
      console.error('🧹 [PROYECTO] Respuesta limpia intentada:', cleanResponse?.substring(0, 500) + (cleanResponse?.length > 500 ? '...(truncated)' : ''))
      return NextResponse.json(
        { 
          error: 'Error procesando respuesta de la IA',
          details: parseError instanceof Error ? parseError.message : 'Error desconocido',
          geminiResponse: geminiResponse.substring(0, 1000) // Solo los primeros 1000 caracteres para debug
        },
        { status: 500 }
      )
    }


    // PASO 8: Guardar el Contenido del Proyecto
    console.log('💾 [PROYECTO] Guardando fases del proyecto en base de datos')
    const saveStartTime = Date.now()
    
    const fasesParaInsertar = fasesGeneradas.map(fase => ({
      proyecto_id: proyectoId,
      fase_nombre: fase.fase,
      momento_nombre: fase.momento,
      contenido: fase.contenido_generado,
      orden: fasesGeneradas.indexOf(fase) + 1
    }))

    const { error: fasesError } = await supabase
      .from('proyecto_fases')
      .insert(fasesParaInsertar)

    const saveTime = Date.now() - saveStartTime
    console.log(`⏱️ [PROYECTO] Tiempo guardando fases: ${saveTime}ms`)

    if (fasesError) {
      console.error('❌ [PROYECTO] Error guardando fases:', fasesError)
      return NextResponse.json(
        { error: `Error guardando fases del proyecto: ${fasesError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ [PROYECTO] Fases guardadas exitosamente')

    // PASO 9: Insertar registro en project_creations para rastrear límites lifetime
    console.log('📊 [PROYECTO] Registrando creación para límites de usuario')
    const { error: creationError } = await supabase
      .from('project_creations')
      .insert({
        user_id: user.id,
        project_id: proyectoId,
        created_at: proyecto.created_at
      })

    if (creationError) {
      console.error('⚠️ [PROYECTO] Error creating project creation record:', creationError)
      // No retornamos error aquí porque el proyecto ya se creó exitosamente
      // Solo logueamos el error para debugging
    } else {
      console.log('✅ [PROYECTO] Registro de creación guardado exitosamente')
    }

    // PASO 10: Finalizar y Responder al Frontend
    const totalTime = Date.now() - startTime
    console.log(`🎉 [PROYECTO] Proyecto creado exitosamente en ${totalTime}ms`)
    console.log('📈 [PROYECTO] Resumen de tiempos:', {
      proyecto: proyectoTime,
      relaciones: relacionesTime,
      datos: dataTime,
      prompt: promptTime,
      ia: aiTime,
      parse: parseTime,
      save: saveTime,
      total: totalTime
    })
    
    return NextResponse.json({
      success: true,
      proyecto_id: proyectoId,
      nombre: proyecto.nombre,
      fases_generadas: fasesGeneradas.length,
      message: 'Proyecto creado y contenido generado exitosamente'
    })

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error('❌ [PROYECTO] Error en la API de creación de proyectos:', error)
    console.error(`⏱️ [PROYECTO] Tiempo total antes del error: ${totalTime}ms`)
    return NextResponse.json(
      {
        error: 'Error interno del servidor al crear el proyecto',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
