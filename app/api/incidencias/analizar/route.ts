import { createClient } from '@supabase/supabase-js'
import { google } from '@ai-sdk/google'
import { embed, generateText } from 'ai'



export async function POST(req: Request) {
    try {
        const { descripcion, plantel_id, alumno_id, user_id } = await req.json()

        if (!descripcion) {
            return new Response('Descripción es requerida', { status: 400 })
        }

        // Usar Service Role Key para acceso completo a documentos legales (backend)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Obtener Datos de Contexto

        // Fetch Director (usuario que crea la incidencia)
        let director = null
        if (user_id) {
            const { data: dData, error: dError } = await supabase
                .from('profiles')
                .select('full_name, role')
                .eq('id', user_id)
                .single()

            if (dError) console.error("❌ Error fetching director:", dError)
            else console.log("✅ Director found:", dData)

            director = dData
        }

        // Debug: Fetch Plantel individual para ver error
        let plantel = null
        if (plantel_id) {
            const { data: pData, error: pError } = await supabase
                .from('planteles')
                .select('nombre, codigo_plantel')
                .eq('id', plantel_id)
                .single()

            if (pError) console.error("❌ Error fetching plantel:", pError)
            else console.log("✅ Plantel found:", pData)

            plantel = pData
        }

        const [
            { data: alumno },
            { embedding }
        ] = await Promise.all([
            // Fetch Alumno (Si hay ID)
            alumno_id ? supabase.from('alumnos').select('nombre_completo, grupos(grado, nombre)').eq('id', alumno_id).single() : { data: null },
            // Generar embedding
            embed({
                model: google.textEmbeddingModel("text-embedding-004"),
                value: descripcion,
            })
        ])

        // 2. Buscar protocolos relevantes en Supabase (RAG)
        const { data: documents, error } = await supabase.rpc('match_legal_documents', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3
        })

        if (error) {
            console.error("Error buscando documentos legales:", error)
        }

        // 3. Preparar variables de contexto
        const fechaActual = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        const horaActual = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

        // CORRECCIÓN: Si no hay nombre, usar texto genérico "la Escuela" en lugar del placeholder mismo
        // para evitar que el replace reemplace [NOMBRE_ESCUELA] con "[NOMBRE_ESCUELA]"
        const nombrePlantel = plantel?.nombre || "la Escuela"
        const nombreAlumno = alumno?.nombre_completo || "el Alumno"
        const gradoGrupo = alumno?.grupos ? `${alumno.grupos.grado}° ${alumno.grupos.nombre}` : "Grado y Grupo no especificado"
        const nombreDirector = director?.full_name || "el Director(a)"

        const datosReporte = `
        DATOS REALES DEL REPORTE:
        - Escuela: ${nombrePlantel} (CCT: ${plantel?.codigo_plantel || 'N/A'})
        - Director/a: ${nombreDirector}
        - Alumno: ${nombreAlumno}
        - Grado y Grupo: ${gradoGrupo}
        - Fecha: ${fechaActual}
        - Hora: ${horaActual}
        `

        // 3. Construir el contexto para Gemini
        const contextText = documents?.map((d: any) => d.content).join('\n---\n') || "No se encontró protocolo específico."

        console.log("📝 Contexto para análisis:", {
            plantelIdRecibido: plantel_id,
            nombrePlantel,
            nombreAlumno,
            docs: documents?.length
        })

        // 4. Generar la respuesta final
        const systemPrompt = `
    ERES UN ASESOR JURÍDICO ESCOLAR DE LA SEP (MÉXICO).
    Tu misión es proteger al Director y al Alumno siguiendo estrictamente el protocolo de convivencia escolar.
    
    CONTEXTO LEGAL:
    ${contextText}

    ${datosReporte}
    
    TAREA:
    Analiza el reporte del director y genera una respuesta estructurada en FORMATO JSON ÚNICAMENTE.
    
    CRITERIOS DE RIESGO (APLICAR ESTRICTAMENTE):
    
    🟢 RIESGO BAJO:
    - Conflictos verbales sin agresión física
    - Indisciplina menor (no seguir instrucciones, llegar tarde)
    - Uso de lenguaje inapropiado sin amenazas
    - EJEMPLO: "Un alumno le dijo groserías a otro" = BAJO
    
    🟡 RIESGO MEDIO:
    - Acoso verbal reiterado (bullying verbal)
    - Empujones o agresiones físicas leves SIN LESIONES
    - Vandalismo menor
    - EJEMPLO: "Un alumno empujó a otro y lo insultó" = MEDIO
    
    🟠 RIESGO ALTO:
    - Pelea con golpes que causan lesiones menores (moretones, raspones)
    - Consumo de sustancias (cigarros, alcohol)
    - Acoso escolar severo con patrón documentado
    - Robo o daño a propiedad significativo
    - EJEMPLO: "Encontramos al alumno fumando" = ALTO
    
    🔴 RIESGO INMINENTE (ÚNICO CASO PARA 911):
    - Portación de ARMAS (navajas, armas de fuego)
    - Lesiones GRAVES que requieren atención médica urgente (sangrado abundante, fracturas, inconsciencia)
    - Abuso sexual en flagrancia
    - Amenaza de muerte creíble e inmediata
    - EJEMPLO: "El alumno sacó un cuchillo y amenazó" = INMINENTE
    
    ⚠️ REGLA CRÍTICA: SOLO "Riesgo Inminente" puede incluir "Llamar al 911". 
    Para Riesgo Alto, Medium o Bajo, NO incluyas 911 en las acciones.
    
    El "acta_borrador" debe ser un texto formal listo para firmar. INCORPORA LOS DATOS REALES (${nombrePlantel}, ${nombreAlumno}, ${fechaActual}) DIRECTAMENTE en el texto narrativo.
    NO USES PLACEHOLDERS como [NOMBRE_ESCUELA] o [NOMBRE_ALUMNO], usa los valores reales proporcionados arriba.
    
    CLASIFICA EL TIPO DE INCIDENCIA (tipo_incidencia) en uno de los siguientes valores exactos:
    - 'portacion_armas'
    - 'consumo_sustancias'
    - 'acoso_escolar'
    - 'violencia_fisica'
    - 'accidente_escolar'
    - 'disturbio_externo'
    - 'otro'

    FORMATO SOLICITADO (JSON):
    {
      "clasificacion": "Riesgo Bajo" | "Riesgo Medio" | "Riesgo Alto" | "Riesgo Inminente",
      "tipo_incidencia": "valor_enum_exacto",
      "acciones_urgentes": ["accion 1", "accion 2"],
      "acta_borrador": "En la ciudad de...",
      "fundamento_legal": "Referencia al artículo o sección..."
    }
    `

        const { text: resultText } = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: `Analiza este reporte de incidencia: "${descripcion}"`,
            system: systemPrompt,
        })

        // Procesar y limpiar JSON (Patrón de proyectos/create)
        let jsonResponse = resultText.trim()
        if (jsonResponse.startsWith('```json')) {
            jsonResponse = jsonResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonResponse.startsWith('```')) {
            jsonResponse = jsonResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        try {
            const parsedResult = JSON.parse(jsonResponse)

            // POST-PROCESAMIENTO: Forzar reemplazo de placeholders para garantizar datos reales
            let acta = parsedResult.acta_borrador || ""

            // Reemplazo robusto (insensitive case y variantes comunes)
            // Reemplazo robusto (insensitive case y variantes comunes, con/sin guiones bajos)
            acta = acta.replace(/\[NOMBRE[_ ]ESCUELA\]/gi, nombrePlantel)
                .replace(/\[NOMBRE[_ ]DE[_ ]LA[_ ]ESCUELA\]/gi, nombrePlantel)
                .replace(/\[INSTITUCION\]/gi, nombrePlantel)
                .replace(/\[NOMBRE[_ ]INSTITUCION\]/gi, nombrePlantel)
                .replace(/\[LUGAR[_ ]ESPECÍFICO[_ ]ESCUELA\]/gi, nombrePlantel)
                .replace(/\[NOMBRE[_ ]ALUMNO\]/gi, nombreAlumno)
                .replace(/\[NOMBRE[_ ]DEL[_ ]ALUMNO\]/gi, nombreAlumno)
                .replace(/\[ALUMNO\]/gi, nombreAlumno)
                .replace(/\[GRADO[_ ]GRUPO\]/gi, gradoGrupo)
                .replace(/\[NOMBRE[_ ]DEL[_ ]DIRECTOR[A\/]?\]/gi, nombreDirector)
                .replace(/\[DIRECTOR[A\/]?\]/gi, nombreDirector)
                .replace(/\[FECHA\]/gi, fechaActual)
                .replace(/\[HORA\]/gi, horaActual)

            parsedResult.acta_borrador = acta

            // VALIDACIÓN ESTRICTA DEL TIPO DE INCIDENCIA (ENUM)
            const validTypes = [
                'portacion_armas',
                'consumo_sustancias',
                'acoso_escolar',
                'violencia_fisica',
                'accidente_escolar',
                'disturbio_externo',
                'otro'
            ]

            if (!validTypes.includes(parsedResult.tipo_incidencia)) {
                console.warn(`Tipo de incidencia inválido de IA: "${parsedResult.tipo_incidencia}". Forzando "otro".`)
                parsedResult.tipo_incidencia = 'otro'
            }

            return Response.json(parsedResult)
        } catch (e) {
            console.error("Error parsing JSON from AI:", e)
            console.error("Raw response:", jsonResponse)
            return new Response(JSON.stringify({ error: 'Error procesando respuesta de IA', raw: jsonResponse }), { status: 500 })
        }

    } catch (error) {
        console.error('Error en análisis legal:', error)
        return new Response(JSON.stringify({ error: 'Error procesando solicitud' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
