import { supabase } from "./supabase"

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
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PlaneacionCreate {
  titulo: string
  materia?: string
  grado?: string
  duracion?: string
  objetivo?: string
  contenido: string
  estado?: "borrador" | "completada" | "archivada"
}

// Obtener planeaciones del usuario (excluye eliminadas) con paginación
export async function getPlaneaciones(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ data: Planeacion[]; count: number }> {
  try {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from("planeaciones")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      console.error("Error fetching planeaciones:", error)
      return { data: [], count: 0 }
    }

    return { data: data || [], count: count || 0 }
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
      .select("*")
      .eq("id", planeacionId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching planeacion:", error)
      return null
    }

    return data
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
    } else {
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

  const { error, data } = await supabase
    .from("planeaciones")
    .delete()
    .eq("id", planeacionId);


  if (error) {
    console.error("Error deleting planeacion:", error);
    return false;
  }

  return true;
}


// Función para limpiar el contenido de la planeación
function cleanPlaneacionContent(content: string): string {
  if (!content) return ""

  let cleanedContent = content

  // Eliminar texto introductorio común
  const introPatterns = [
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
  ]

  endPatterns.forEach((pattern) => {
    cleanedContent = cleanedContent.replace(pattern, "")
  })

  // Limpiar espacios extra al inicio y final
  cleanedContent = cleanedContent.trim()

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
  // Primero limpiar el contenido
  const cleanedContent = cleanPlaneacionContent(content)
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
      materia = line.split(":")[1]?.trim() || ""
    }

    // Extraer grado
    if (lowerLine.includes("grado:") || lowerLine.includes("nivel:")) {
      grado = line.split(":")[1]?.trim() || ""
    }

    // Extraer duración
    if (lowerLine.includes("duración:") || lowerLine.includes("tiempo:")) {
      duracion = line.split(":")[1]?.trim() || ""
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
      objetivo = objContent.join(" ").trim()
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

// Función para generar PDF mejorada
export function generatePDF(planeacion: Planeacion): void {
  // Importar la función del nuevo archivo
  import("./pdf-generator").then(({ generatePDF: pdfGen }) => {
    pdfGen(planeacion)
  })
}
