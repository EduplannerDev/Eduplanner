import { createClient } from '@/lib/supabase';

export interface Alumno {
  id: string;
  grupo_id: string;
  user_id: string;
  nombre_completo: string;
  numero_lista?: number;
  foto_url?: string;
  notas_generales?: string;
  // Información de los padres
  nombre_padre?: string;
  correo_padre?: string;
  telefono_padre?: string;
  nombre_madre?: string;
  correo_madre?: string;
  telefono_madre?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlumnoData {
  grupo_id: string;
  nombre_completo: string;
  numero_lista?: number;
  foto_url?: string;
  notas_generales?: string;
  // Información de los padres
  nombre_padre?: string;
  correo_padre?: string;
  telefono_padre?: string;
  nombre_madre?: string;
  correo_madre?: string;
  telefono_madre?: string;
}

export interface UpdateAlumnoData {
  nombre_completo?: string;
  numero_lista?: number;
  foto_url?: string;
  notas_generales?: string;
  // Información de los padres
  nombre_padre?: string;
  correo_padre?: string;
  telefono_padre?: string;
  nombre_madre?: string;
  correo_madre?: string;
  telefono_madre?: string;
}

export interface SeguimientoDiario {
  id: string;
  alumno_id: string;
  user_id: string;
  fecha: string;
  nota: string;
  tipo: 'general' | 'academico' | 'comportamiento' | 'logro';
  created_at: string;
  updated_at: string;
}

export interface CreateSeguimientoData {
  alumno_id: string;
  nota: string;
  tipo?: 'general' | 'academico' | 'comportamiento' | 'logro';
  fecha?: string;
}

/**
 * Obtiene todos los alumnos de un grupo específico
 */
export async function getAlumnosByGrupo(grupoId: string): Promise<Alumno[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .eq('grupo_id', grupoId)
    .order('numero_lista', { ascending: true, nullsLast: true })
    .order('nombre_completo', { ascending: true });

  if (error) {
    console.error('Error fetching alumnos:', error);
    throw new Error('Error al obtener los alumnos');
  }

  return data || [];
}

/**
 * Obtiene un alumno específico por ID
 */
export async function getAlumnoById(id: string): Promise<Alumno | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching alumno:', error);
    return null;
  }

  return data;
}

/**
 * Crea un nuevo alumno
 */
export async function createAlumno(alumnoData: CreateAlumnoData): Promise<Alumno> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Si no se proporciona numero_lista, obtener el siguiente disponible
  let numeroLista = alumnoData.numero_lista;
  if (!numeroLista) {
    const { data: existingAlumnos } = await supabase
      .from('alumnos')
      .select('numero_lista')
      .eq('grupo_id', alumnoData.grupo_id)
      .not('numero_lista', 'is', null)
      .order('numero_lista', { ascending: false })
      .limit(1);
    
    numeroLista = existingAlumnos && existingAlumnos.length > 0 
      ? (existingAlumnos[0].numero_lista || 0) + 1 
      : 1;
  }

  const { data, error } = await supabase
    .from('alumnos')
    .insert({
      ...alumnoData,
      numero_lista: numeroLista,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating alumno:', error);
    throw new Error('Error al crear el alumno');
  }

  return data;
}

/**
 * Actualiza un alumno existente
 */
export async function updateAlumno(id: string, alumnoData: UpdateAlumnoData): Promise<Alumno> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('alumnos')
    .update(alumnoData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating alumno:', error);
    throw new Error('Error al actualizar el alumno');
  }

  return data;
}

/**
 * Elimina un alumno
 */
export async function deleteAlumno(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('alumnos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting alumno:', error);
    throw new Error('Error al eliminar el alumno');
  }
}

/**
 * Obtiene el seguimiento diario de un alumno
 */
export async function getSeguimientoByAlumno(alumnoId: string): Promise<SeguimientoDiario[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('seguimiento_diario')
    .select('*')
    .eq('alumno_id', alumnoId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching seguimiento:', error);
    throw new Error('Error al obtener el seguimiento');
  }

  return data || [];
}

/**
 * Crea una nueva entrada de seguimiento diario
 */
export async function createSeguimiento(seguimientoData: CreateSeguimientoData): Promise<SeguimientoDiario> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await supabase
    .from('seguimiento_diario')
    .insert({
      ...seguimientoData,
      user_id: user.id,
      fecha: seguimientoData.fecha || new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating seguimiento:', error);
    throw new Error('Error al crear el seguimiento');
  }

  return data;
}

/**
 * Actualiza una entrada de seguimiento diario
 */
export async function updateSeguimiento(id: string, nota: string, tipo?: string): Promise<SeguimientoDiario> {
  const supabase = createClient();
  
  const updateData: any = { nota };
  if (tipo) updateData.tipo = tipo;

  const { data, error } = await supabase
    .from('seguimiento_diario')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating seguimiento:', error);
    throw new Error('Error al actualizar el seguimiento');
  }

  return data;
}

/**
 * Elimina una entrada de seguimiento diario
 */
export async function deleteSeguimiento(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('seguimiento_diario')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting seguimiento:', error);
    throw new Error('Error al eliminar el seguimiento');
  }
}

/**
 * Obtiene estadísticas de alumnos por grupo
 */
export async function getAlumnosStats(grupoId: string) {
  const supabase = createClient();
  
  const { data: alumnos, error: alumnosError } = await supabase
    .from('alumnos')
    .select('id')
    .eq('grupo_id', grupoId);

  if (alumnosError) {
    console.error('Error fetching alumnos stats:', alumnosError);
    throw new Error('Error al obtener estadísticas de alumnos');
  }

  const totalAlumnos = alumnos?.length || 0;

  // Obtener seguimientos de la última semana
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 7);
  
  const { data: seguimientos, error: seguimientosError } = await supabase
    .from('seguimiento_diario')
    .select('alumno_id')
    .in('alumno_id', alumnos?.map(a => a.id) || [])
    .gte('fecha', fechaLimite.toISOString().split('T')[0]);

  if (seguimientosError) {
    console.error('Error fetching seguimientos stats:', seguimientosError);
  }

  const seguimientosRecientes = seguimientos?.length || 0;

  return {
    totalAlumnos,
    seguimientosRecientes
  };
}