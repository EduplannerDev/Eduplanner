import { supabase } from "./supabase"
import { convertMarkdownToHtml } from "@/components/ui/rich-text-editor"

export interface Planeacion {
  id: string
  user_id: string
  titulo: string
  materia: string | null
  grado: string | null
  duracion: string | null
  objetivo: string | null
  contenido: string
  estado: "borrador" | "completada" | "archivada"
  origen: "manual" | "dosificacion" | null
  contenidos_relacionados: string[] | null
  mes_dosificacion: string | null
  metodologia: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Campos de envío a dirección
  envio_estado?: "pendiente" | "aprobada" | "cambios_solicitados" | null
  envio_id?: string | null
  fecha_envio?: string | null
  comentarios_director?: string | null
  fecha_revision?: string | null
}

export interface PlaneacionCreate {
  titulo: string
  materia?: string
  grado?: string
  duracion?: string
  objetivo?: string
  contenido: string
  estado?: "borrador" | "completada" | "archivada"
  origen?: "manual" | "dosificacion"
  contenidos_relacionados?: string[]
  mes_dosificacion?: string
  metodologia?: string
}

// Filtros para las planeaciones
export interface PlaneacionFilters {
  search?: string
  materia?: string
  grado?: string
  estado?: string
  metodologia?: string
  startDate?: string | null
  endDate?: string | null
  sortOrder?: 'asc' | 'desc'
}

// Obtener planeaciones del usuario (excluye eliminadas) con paginación y filtros
export async function getPlaneaciones(
  userId: string,
  page: number,
  pageSize: number,
  filters?: PlaneacionFilters
): Promise<{ data: Planeacion[]; count: number }> {
  try {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let query = supabase
      .from("planeaciones")
      .select(`
        *,
        planeaciones_enviadas!planeacion_id (
          id,
          estado,
          fecha_envio,
          comentarios_director,
          fecha_revision
        )
      `, { count: "exact" })
      .eq("user_id", userId)
      .is("deleted_at", null)

    // Aplicar filtros
    if (filters) {
      if (filters.search) {
        query = query.ilike('titulo', `%${filters.search}%`)
      }
      if (filters.materia && filters.materia !== 'todas') {
        query = query.eq('materia', filters.materia)
      }
      if (filters.grado && filters.grado !== 'todos') {
        query = query.eq('grado', filters.grado)
      }
      if (filters.estado && filters.estado !== 'todos') {
        query = query.eq('estado', filters.estado)
      }
      if (filters.metodologia && filters.metodologia !== 'todos') {
        if (filters.metodologia === 'NEM') {
          // Asumiendo que NEM es null o 'NEM' explícito, o 'null' para legacy?
          // Mejor filtrar explícitamente si existe la columna
          query = query.or('metodologia.eq.NEM,metodologia.is.null')
        } else {
          query = query.eq('metodologia', filters.metodologia)
        }
      }
      // Filtros de fecha
      if (filters.startDate) {
        // Asegurar que comience al inicio del día
        const start = new Date(filters.startDate)
        start.setHours(0, 0, 0, 0)
        query = query.gte('created_at', start.toISOString())
      }
      if (filters.endDate) {
        // Asegurar que termine al final del día
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        query = query.lte('created_at', end.toISOString())
      }
    }

    // Sorting
    const sortOrder = filters?.sortOrder === 'asc'
    const { data, error, count } = await query
      .order("created_at", { ascending: sortOrder })
      .range(start, end)

    if (error) {
      console.error("Error fetching planeaciones:", error)
      return { data: [], count: 0 }
    }

    // Mapear los datos para incluir el estado de envío
    const mappedData = (data || []).map(planeacion => {
      // Supabase puede devolver planeaciones_enviadas como objeto o array dependiendo de la relación
      const envio = Array.isArray(planeacion.planeaciones_enviadas)
        ? planeacion.planeaciones_enviadas[0]
        : planeacion.planeaciones_enviadas

      const mapped = {
        ...planeacion,
        envio_estado: envio?.estado || null,
        envio_id: envio?.id || null,
        fecha_envio: envio?.fecha_envio || null,
        comentarios_director: envio?.comentarios_director || null,
        fecha_revision: envio?.fecha_revision || null,
      }
      return mapped
    })

    return { data: mappedData, count: count || 0 }
  } catch (error) {
    console.error("Error in getPlaneaciones:", error)
    return { data: [], count: 0 }
  }
}

// Obtener una planeación específica
export async function getPlaneacion(planeacionId: string): Promise<Planeacion | null> {
  try {
    const { data, error } = await supabase
      .from("planeaciones")
      .select(`
        *,
        planeaciones_enviadas!planeacion_id (
          id,
          estado,
          fecha_envio,
          comentarios_director,
          fecha_revision
        )
      `)
      .eq("id", planeacionId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching planeacion:", error)
      return null
    }

    // Mapear los datos para incluir el estado de envío
    const envio = Array.isArray(data.planeaciones_enviadas)
      ? data.planeaciones_enviadas[0]
      : data.planeaciones_enviadas

    return {
      ...data,
      envio_estado: envio?.estado || null,
      envio_id: envio?.id || null,
      envio_fecha: envio?.fecha_envio || null, // Nota: interfaz dice fecha_envio
      fecha_envio: envio?.fecha_envio || null,
      comentarios_director: envio?.comentarios_director || null,
      fecha_revision: envio?.fecha_revision || null,
    }
  } catch (error) {
    console.error("Error in getPlaneacion:", error)
    return null
  }
}

// Crear nueva planeación
export async function createPlaneacion(userId: string, planeacion: PlaneacionCreate): Promise<Planeacion | null> {
  try {
    const { data, error } = await supabase
      .from("planeaciones")
      .insert({
        user_id: userId,
        ...planeacion,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating planeacion:", error)
      return null
    }

    // Registrar la creación de la planeación en la nueva tabla
    const { error: creationError } = await supabase
      .from("planeacion_creations")
      .insert({
        user_id: userId,
        planeacion_id: data.id,
      });

    if (creationError) {
      console.error("Error registering planeacion creation:", creationError);
      // Considerar si se debe revertir la creación de la planeación principal
    }

    // Si hay contenidos relacionados, crear las relaciones en planeacion_contenidos
    if (planeacion.contenidos_relacionados && planeacion.contenidos_relacionados.length > 0) {
      const relaciones = planeacion.contenidos_relacionados.map(contenidoId => ({
        planeacion_id: data.id,
        contenido_id: contenidoId
      }));

      const { error: relacionesError } = await supabase
        .from("planeacion_contenidos")
        .insert(relaciones);

      if (relacionesError) {
        console.error("Error creating planeacion-contenido relations:", relacionesError);
        // No revertimos la planeación principal, pero registramos el error
      }
    }

    return data
  } catch (error) {
    console.error("Error in createPlaneacion:", error)
    return null
  }
}

// Obtener conteo de planeaciones del mes actual
export async function getMonthlyPlaneacionesCount(userId: string): Promise<number> {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const { count, error } = await supabase
      .from("planeacion_creations")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    if (error) {
      console.error("Error getting monthly count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getMonthlyPlaneacionesCount:", error)
    return 0
  }
}

// Verificar si el usuario puede crear más planeaciones
export async function canCreatePlaneacion(userId: string, userPlan: "free" | "pro"): Promise<boolean> {
  if (userPlan === "pro") {
    return true // Los usuarios pro tienen planeaciones ilimitadas
  }

  const monthlyCount = await getMonthlyPlaneacionesCount(userId)
  return monthlyCount < 5 // Los usuarios free tienen límite de 5 por mes
}

// Actualizar planeación (solo contenido para edición)
export async function updatePlaneacion(planeacionId: string, updates: Partial<PlaneacionCreate>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("planeaciones")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planeacionId)
      .is("deleted_at", null)

    if (error) {
      console.error("Error updating planeacion:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updatePlaneacion:", error)
    return false
  }
}

// Soft delete de planeación
export async function deletePlaneacion(planeacionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("planeaciones")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", planeacionId);

    if (error) {
      console.error("Error deleting planeacion:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deletePlaneacion:", error);
    return false;
  }
}


// Función para limpiar el contenido de la planeación
function cleanPlaneacionContent(content: string): string {
  if (!content) return ""

  let cleanedContent = content

  // Eliminar texto introductorio común
  const introPatterns = [
    /^¡[^!]*!\s*[^.]*\.\s*Aquí tienes[^:]*:\s*/i, // Captura cualquier exclamación inicial + explicación + "Aquí tienes"
    /^¡Perfecto!\s*Aquí tienes una planeación didáctica[^:]*:\s*/i,
    /^Aquí tienes una planeación didáctica[^:]*:\s*/i,
    /^Te presento una planeación didáctica[^:]*:\s*/i,
    /^Esta es una planeación didáctica[^:]*:\s*/i,
  ]

  introPatterns.forEach((pattern) => {
    cleanedContent = cleanedContent.replace(pattern, "")
  })

  // Eliminar la pregunta final sobre guardar
  const endPatterns = [
    /¿Te gustaría que añadiera alguna otra actividad o modificáramos algún aspecto de la planeación\?[^?]*\?$/i,
    /¿Quieres que añada algo más a esta planeación\?[^?]*\?$/i,
    /¿Te gustaría modificar algo de esta planeación\?[^?]*\?$/i,
    /Recuerda que esta es una sugerencia, puedes adaptarla a las necesidades específicas de tus alumnos\.\s*¿Te gustaría que añadiera alguna otra actividad o modificáramos algún aspecto de la planeación\?\s*O si estás satisfecho con la planeación, ¿quieres guardarla para poder acceder a ella después desde 'Mis Planeaciones'\??[\s\S]*$/i,
    /Recuerda que esta es una sugerencia[^?]*\?$/i,
    /Aquí tienes un borrador de tu planeación\.[\s\S]*¿quieres guardarla para poder acceder a ella después desde 'Mis Planeaciones'\?[\s\S]*$/i,
    /Aquí tienes un borrador de tu planeación\.[\s\S]*$/i,
  ]

  endPatterns.forEach((pattern) => {
    cleanedContent = cleanedContent.replace(pattern, "")
  })

  // Limpiar espacios extra al inicio y final
  cleanedContent = cleanedContent.trim()

  // Convertir markdown a HTML
  cleanedContent = convertMarkdownToHtml(cleanedContent)

  return cleanedContent
}

// Función para extraer información de una planeación generada por IA
export function extractPlaneacionInfo(content: string): {
  titulo: string
  materia: string
  grado: string
  duracion: string
  objetivo: string
} {
  // Limpiar solo el texto introductorio, pero NO convertir a HTML aún
  let cleanedContent = content

  // Eliminar texto introductorio común
  const introPatterns = [
    /^¡Perfecto!\s*Aquí tienes una planeación didáctica[^:]*:\s*/i,
    /^Aquí tienes una planeación didáctica[^:]*:\s*/i,
    /^Te presento una planeación didáctica[^:]*:\s*/i,
    /^Esta es una planeación didáctica[^:]*:\s*/i,
    /^¡Excelente elección!\s*[^.]*\.\s*Aquí tienes[^:]*:\s*/i,
  ]

  introPatterns.forEach((pattern) => {
    cleanedContent = cleanedContent.replace(pattern, "")
  })

  // Eliminar la pregunta final sobre guardar
  const endPatterns = [
    /¿Te gustaría que añadiera alguna otra actividad o modificáramos algún aspecto de la planeación\?[^?]*\?$/i,
    /¿Quieres que añada algo más a esta planeación\?[^?]*\?$/i,
    /¿Te gustaría modificar algo de esta planeación\?[^?]*\?$/i,
    /Recuerda que esta es una sugerencia, puedes adaptarla a las necesidades específicas de tus alumnos\.\s*¿Te gustaría que añadiera alguna otra actividad o modificáramos algún aspecto de la planeación\?\s*O si estás satisfecho con la planeación, ¿quieres guardarla para poder acceder a ella después desde 'Mis Planeaciones'\??[\s\S]*$/i,
    /Recuerda que esta es una sugerencia[^?]*\?$/i,
    /Aquí tienes un borrador de tu planeación\.[\s\S]*¿quieres guardarla para poder acceder a ella después desde 'Mis Planeaciones'\?[\s\S]*$/i,
    /Aquí tienes un borrador de tu planeación\.[\s\S]*$/i,
  ]

  endPatterns.forEach((pattern) => {
    cleanedContent = cleanedContent.replace(pattern, "")
  })

  cleanedContent = cleanedContent.trim()
  const lines = cleanedContent.split("\n")

  // Buscar patrones comunes en las respuestas de la IA
  let titulo = "Planeación Generada"
  let materia = ""
  let grado = ""
  let duracion = ""
  let objetivo = ""

  for (const line of lines) {
    const lowerLine = line.toLowerCase()

    // Extraer materia
    if (lowerLine.includes("materia:") || lowerLine.includes("asignatura:")) {
      materia = line.split(":")[1]?.trim().replace(/\*\*/g, "").trim() || ""
    }

    // Extraer grado
    if (lowerLine.includes("grado:") || lowerLine.includes("nivel:")) {
      grado = line.split(":")[1]?.trim().replace(/\*\*/g, "").trim() || ""
    }

    // Extraer duración
    if (lowerLine.includes("duración:") || lowerLine.includes("tiempo:")) {
      duracion = line.split(":")[1]?.trim().replace(/\*\*/g, "").trim() || ""
    }

    // Extraer objetivo (Propósito general de la clase)
    if (lowerLine.includes("propósito general de la clase")) {
      const startIndex = lines.indexOf(line)
      let objContent = []

      // Extract content from the current line after the header
      const contentOnHeaderLine = line.split(":").slice(1).join(":").trim()
      if (contentOnHeaderLine) {
        objContent.push(contentOnHeaderLine)
      }

      // Continue collecting lines from the one after the header
      for (let i = startIndex + 1; i < lines.length; i++) {
        const currentLine = lines[i].trim()
        // Stop if we hit the next known section header
        if (currentLine.toLowerCase().includes("aprendizajes esperados") ||
          currentLine.toLowerCase().includes("procesos de desarrollo del aprendizaje") ||
          currentLine.toLowerCase().includes("contenidos específicos") ||
          currentLine.toLowerCase().includes("ejes articuladores") ||
          currentLine.toLowerCase().includes("metodología") ||
          currentLine.toLowerCase().includes("secuencia didáctica") ||
          currentLine.toLowerCase().includes("actividades sugeridas") ||
          currentLine.toLowerCase().includes("materiales y recursos") ||
          currentLine.toLowerCase().includes("instrumento de evaluación") ||
          currentLine.toLowerCase().includes("sugerencias de adecuación") ||
          currentLine.toLowerCase().includes("propuestas de ampliación")
        ) {
          break // Se encontró el inicio de una nueva sección
        }
        // Only add non-empty lines
        if (currentLine) {
          objContent.push(currentLine)
        }
      }
      // Unir las líneas y limpiar espacios extra
      objetivo = objContent.join(" ").trim().replace(/\*\*/g, "").trim()
    }

    // Generar título basado en materia y tema
    if (materia && (lowerLine.includes("tema:") || lowerLine.includes("sobre"))) {
      const tema = line.split(":")[1]?.trim() || line.split("sobre")[1]?.trim() || ""
      if (tema) {
        titulo = `${materia} - ${tema}`.substring(0, 100)
      }
    }
  }

  return {
    titulo: titulo || "Planeación Generada",
    materia: materia || "General",
    grado: grado || "Primaria",
    duracion: duracion || "50 minutos",
    objetivo: objetivo || "Objetivo de aprendizaje",
  }
}

// Función para obtener el contenido limpio para guardar
export function getCleanContentForSaving(content: string): string {
  return cleanPlaneacionContent(content)
}

// =====================================================
// FUNCIONES PARA ENLACES PROYECTO-MOMENTO-PLANEACION
// =====================================================

// Función para crear un enlace entre momento de proyecto y planeación
export async function createProyectoMomentoPlaneacionLink(
  proyectoFaseId: string,
  planeacionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('proyecto_momento_planeacion')
      .insert({
        proyecto_fase_id: proyectoFaseId,
        planeacion_id: planeacionId
      })

    if (error) {
      console.error('Error creando enlace proyecto-momento-planeación:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error inesperado creando enlace:', error)
    return false
  }
}

// Función para eliminar un enlace entre momento de proyecto y planeación
export async function deleteProyectoMomentoPlaneacionLink(
  proyectoFaseId: string,
  planeacionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('proyecto_momento_planeacion')
      .delete()
      .eq('proyecto_fase_id', proyectoFaseId)
      .eq('planeacion_id', planeacionId)

    if (error) {
      console.error('Error eliminando enlace proyecto-momento-planeación:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error inesperado eliminando enlace:', error)
    return false
  }
}

// Función para obtener las fases de un proyecto con sus planeaciones enlazadas
export async function getProyectoFasesWithLinks(proyectoId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_proyecto_fases_with_links', { proyecto_uuid: proyectoId })

    if (error) {
      console.error('Error obteniendo fases con enlaces:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error inesperado obteniendo fases con enlaces:', error)
    return []
  }
}

// Función para verificar si un momento ya tiene una planeación enlazada
export async function getPlaneacionLinkedToMomento(proyectoFaseId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('proyecto_momento_planeacion')
      .select(`
        id,
        planeacion_id,
        planeaciones (
          id,
          titulo,
          materia,
          grado,
          duracion,
          objetivo,
          metodologia,
          contenido,
          created_at
        )
      `)
      .eq('proyecto_fase_id', proyectoFaseId)
      .maybeSingle() // Cambiar de .single() a .maybeSingle()

    if (error) {
      console.error('Error verificando enlace de momento:', error)
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    // Si no hay datos o no hay planeación enlazada, retornar null
    if (!data || !data.planeaciones) {
      return null
    }

    return data.planeaciones
  } catch (error) {
    console.error('Error inesperado verificando enlace:', error)
    return null
  }
}

// Función para migrar planeaciones existentes de markdown a HTML
export async function migrateMarkdownPlaneaciones(): Promise<{ migrated: number; errors: number }> {
  let migrated = 0
  let errors = 0
  let page = 1
  const pageSize = 50

  try {
    while (true) {
      // Obtener planeaciones en lotes
      const { data, error } = await supabase
        .from("planeaciones")
        .select("id, contenido")
        .is("deleted_at", null)
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error("Error fetching planeaciones for migration:", error)
        break
      }

      if (!data || data.length === 0) {
        break // No hay más planeaciones
      }

      // Procesar cada planeación
      for (const planeacion of data) {
        try {
          // Verificar si el contenido parece ser markdown (no tiene tags HTML)
          const hasHtmlTags = planeacion.contenido.includes('<') && planeacion.contenido.includes('>')

          if (!hasHtmlTags && planeacion.contenido.trim()) {
            // Convertir markdown a HTML
            const htmlContent = convertMarkdownToHtml(planeacion.contenido)

            // Actualizar solo si el contenido cambió
            if (htmlContent !== planeacion.contenido) {
              const { error: updateError } = await supabase
                .from("planeaciones")
                .update({
                  contenido: htmlContent,
                  updated_at: new Date().toISOString()
                })
                .eq("id", planeacion.id)

              if (updateError) {
                console.error(`Error updating planeacion ${planeacion.id}:`, updateError)
                errors++
              } else {
                migrated++
              }
            }
          }
        } catch (error) {
          console.error(`Error processing planeacion ${planeacion.id}:`, error)
          errors++
        }
      }

      page++
    }
  } catch (error) {
    console.error("Error in migration process:", error)
    errors++
  }

  return { migrated, errors }
}

// Función para generar PDF mejorada
export function generatePDF(planeacion: Planeacion): void {
  // Importar la función del nuevo archivo
  import("./pdf-generator").then(({ generatePlaneacionPDF: pdfGen }) => {
    pdfGen(planeacion)
  })
}
