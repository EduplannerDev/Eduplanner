import { supabase } from './supabase'

export interface ActividadEvaluable {
  id: string
  grupo_id: string
  nombre: string
  tipo: 'examen' | 'tarea' | 'proyecto' | 'participacion' | 'otro'
  descripcion: string | null
  fecha_entrega: string | null
  ponderacion: number
  examen_id: string | null
  planeacion_id: string | null
  created_at: string
  updated_at: string
}

export interface Calificacion {
  id: string
  actividad_id: string
  alumno_id: string
  calificacion: number | null
  retroalimentacion: string | null
  created_at: string
  updated_at: string
}

export interface CreateActividadData {
  grupo_id: string
  nombre: string
  tipo: string
  fecha_entrega?: string
  ponderacion?: number
  examen_id?: string
  planeacion_id?: string
  descripcion?: string
}

export async function getActividadesGrupo(grupoId: string): Promise<ActividadEvaluable[]> {
  const { data, error } = await supabase
    .from('actividades_evaluables')
    .select('*')
    .eq('grupo_id', grupoId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching actividades:', error)
    return []
  }

  return data as ActividadEvaluable[]
}

export async function createActividad(data: CreateActividadData): Promise<ActividadEvaluable | null> {
  const { data: newActividad, error } = await supabase
    .from('actividades_evaluables')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating actividad:', error)
    return null
  }

  return newActividad as ActividadEvaluable
}

export async function updateActividad(id: string, updates: Partial<ActividadEvaluable>): Promise<ActividadEvaluable | null> {
  const { data, error } = await supabase
    .from('actividades_evaluables')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating actividad:', error)
    return null
  }

  return data as ActividadEvaluable
}

export async function deleteActividad(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('actividades_evaluables')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting actividad:', error)
    return false
  }

  return true
}

export async function getCalificacionesGrupo(grupoId: string): Promise<Calificacion[]> {
  // First get all activity IDs for this group
  const actividades = await getActividadesGrupo(grupoId)
  if (actividades.length === 0) return []

  const actividadIds = actividades.map(a => a.id)

  const { data, error } = await supabase
    .from('calificaciones')
    .select('*')
    .in('actividad_id', actividadIds)

  if (error) {
    console.error('Error fetching calificaciones:', error)
    return []
  }

  return data as Calificacion[]
}

export async function saveCalificacion(
  actividadId: string,
  alumnoId: string,
  calificacion: number | null,
  retroalimentacion?: string
): Promise<Calificacion | null> {
  try {
    // Check if ANY record exists (limit 1 to avoid "multiple rows" error)
    const { data: existing, error: fetchError } = await supabase
      .from('calificaciones')
      .select('id')
      .eq('actividad_id', actividadId)
      .eq('alumno_id', alumnoId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching existing calificacion:', fetchError)
      return null
    }

    let result
    let error

    if (existing) {
      // Update ALL matching records (to keep duplicates in sync if they exist)
      // We use select().limit(1).single() to return just one representant for the UI
      const { data, error: updateError } = await supabase
        .from('calificaciones')
        .update({
          calificacion,
          retroalimentacion: retroalimentacion !== undefined ? retroalimentacion : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('actividad_id', actividadId)
        .eq('alumno_id', alumnoId)
        .select()
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      result = data
      error = updateError
    } else {
      // Insert
      const { data, error: insertError } = await supabase
        .from('calificaciones')
        .insert({
          actividad_id: actividadId,
          alumno_id: alumnoId,
          calificacion,
          retroalimentacion
        })
        .select()
        .single()

      result = data
      error = insertError
    }

    if (error) {
      console.error('Error saving calificacion:', error)
      return null
    }

    return result as Calificacion
  } catch (e) {
    console.error('Unexpected error in saveCalificacion:', e)
    return null
  }
}

// --- EVIDENCIAS ---

export interface Evidencia {
  id: string
  actividad_id: string
  user_id: string
  url: string
  tipo: string
  nombre_archivo: string | null
  created_at: string
}

export async function getEvidenciasActividad(actividadId: string): Promise<Evidencia[]> {
  const { data, error } = await supabase
    .from('actividad_evidencias')
    .select('*')
    .eq('actividad_id', actividadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching evidencias:', error)
    return []
  }

  return data as Evidencia[]
}

export async function createEvidencia(
  actividadId: string,
  userId: string,
  url: string,
  tipo: string,
  nombreArchivo: string
): Promise<Evidencia | null> {
  const { data, error } = await supabase
    .from('actividad_evidencias')
    .insert({
      actividad_id: actividadId,
      user_id: userId,
      url,
      tipo,
      nombre_archivo: nombreArchivo
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating evidencia:', error)
    return null
  }

  return data as Evidencia
}

export async function deleteEvidencia(id: string): Promise<boolean> {
  // Nota: Esto solo borra el registro de la BD. El archivo en Storage debería borrarse por separado o via trigger/policy.
  // Idealmente borraríamos ambos aquí si tuviéramos acceso admin, pero desde cliente/server actions es mejor manejarlo explícitamente.
  const { error } = await supabase
    .from('actividad_evidencias')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting evidencia:', error)
    return false
  }

  return true
}

export async function getCalificacionesAlumno(alumnoId: string): Promise<{ actividad: ActividadEvaluable, calificacion: Calificacion | null }[]> {
  // 1. Get student's group to fetch all activities
  const { data: alumno, error: alumnoError } = await supabase
    .from('alumnos')
    .select('grupo_id')
    .eq('id', alumnoId)
    .single()

  if (alumnoError || !alumno) {
    console.error('Error fetching alumno group:', alumnoError)
    return []
  }

  // 2. Get all activities for the group
  const actividades = await getActividadesGrupo(alumno.grupo_id)

  if (actividades.length === 0) return []

  // 3. Get existing grades for this student
  const { data: calificaciones, error: calError } = await supabase
    .from('calificaciones')
    .select('*')
    .eq('alumno_id', alumnoId)

  if (calError) {
    console.error('Error fetching calificaciones:', calError)
    return actividades.map(act => ({
      actividad: act,
      calificacion: null
    }))
  }

  // 4. Merge results
  return actividades.map(act => ({
    actividad: act,
    calificacion: calificaciones?.find(c => c.actividad_id === act.id) || null
  }))
}
