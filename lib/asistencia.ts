import { createClient } from '@/lib/supabase';

export type EstadoAsistencia = 'presente' | 'ausente' | 'retardo' | 'justificado';

export interface RegistroAsistencia {
  id: string;
  alumno_id: string;
  grupo_id: string;
  user_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  notas?: string;
  hora_registro: string;
  created_at: string;
  updated_at: string;
}

export interface AsistenciaConAlumno {
  id: string;
  alumno_id: string;
  alumno_nombre: string;
  alumno_numero_lista?: number;
  estado: EstadoAsistencia;
  notas?: string;
  hora_registro: string;
}

export interface CreateAsistenciaData {
  alumno_id: string;
  grupo_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  notas?: string;
}

export interface UpdateAsistenciaData {
  estado?: EstadoAsistencia;
  notas?: string;
}

export interface EstadisticasAsistencia {
  total_dias: number;
  total_registros: number;
  presentes: number;
  ausentes: number;
  retardos: number;
  justificados: number;
  porcentaje_asistencia: number;
}

/**
 * Obtiene la asistencia de un grupo en una fecha específica
 */
export async function getAsistenciaByGrupoFecha(
  grupoId: string, 
  fecha: string
): Promise<AsistenciaConAlumno[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('get_asistencia_by_grupo_fecha', {
      p_grupo_id: grupoId,
      p_fecha: fecha
    });

  if (error) {
    console.error('Error fetching asistencia:', error);
    throw new Error('Error al obtener la asistencia');
  }

  return data || [];
}

/**
 * Crea un nuevo registro de asistencia
 */
export async function createAsistencia(asistenciaData: CreateAsistenciaData): Promise<RegistroAsistencia> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await supabase
    .from('asistencia')
    .insert({
      ...asistenciaData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asistencia:', error);
    throw new Error('Error al crear el registro de asistencia');
  }

  return data;
}

/**
 * Actualiza un registro de asistencia existente
 */
export async function updateAsistencia(
  id: string, 
  asistenciaData: UpdateAsistenciaData
): Promise<RegistroAsistencia> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('asistencia')
    .update(asistenciaData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating asistencia:', error);
    throw new Error('Error al actualizar el registro de asistencia');
  }

  return data;
}

/**
 * Elimina un registro de asistencia
 */
export async function deleteAsistencia(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('asistencia')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting asistencia:', error);
    throw new Error('Error al eliminar el registro de asistencia');
  }
}

/**
 * Marca a todos los alumnos de un grupo como presentes
 */
export async function marcarTodosPresentes(
  grupoId: string, 
  fecha: string
): Promise<number> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await supabase
    .rpc('marcar_todos_presentes', {
      p_grupo_id: grupoId,
      p_fecha: fecha,
      p_user_id: user.id
    });

  if (error) {
    console.error('Error marking all present:', error);
    throw new Error('Error al marcar todos como presentes');
  }

  return data || 0;
}

/**
 * Obtiene estadísticas de asistencia para un grupo en un rango de fechas
 */
export async function getEstadisticasAsistencia(
  grupoId: string,
  fechaInicio: string,
  fechaFin: string
): Promise<EstadisticasAsistencia> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('get_asistencia_stats', {
      p_grupo_id: grupoId,
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin
    });

  if (error) {
    console.error('Error fetching asistencia stats:', error);
    throw new Error('Error al obtener las estadísticas de asistencia');
  }

  return data?.[0] || {
    total_dias: 0,
    total_registros: 0,
    presentes: 0,
    ausentes: 0,
    retardos: 0,
    justificados: 0,
    porcentaje_asistencia: 0
  };
}

/**
 * Obtiene todos los alumnos de un grupo con su estado de asistencia para una fecha
 * Si no tienen registro, se considera como no marcado
 */
export async function getAlumnosConAsistencia(
  grupoId: string,
  fecha: string
): Promise<AsistenciaConAlumno[]> {
  const supabase = createClient();
  
  // Primero obtenemos todos los alumnos del grupo
  const { data: alumnos, error: alumnosError } = await supabase
    .from('alumnos')
    .select('id, nombre_completo, numero_lista')
    .eq('grupo_id', grupoId)
    .order('numero_lista', { ascending: true, nullsFirst: false })
    .order('nombre_completo', { ascending: true });

  if (alumnosError) {
    console.error('Error fetching alumnos:', alumnosError);
    throw new Error('Error al obtener los alumnos');
  }

  // Luego obtenemos la asistencia existente para esa fecha
  const { data: asistencia, error: asistenciaError } = await supabase
    .from('asistencia')
    .select('*')
    .eq('grupo_id', grupoId)
    .eq('fecha', fecha);

  if (asistenciaError) {
    console.error('Error fetching asistencia:', asistenciaError);
    throw new Error('Error al obtener la asistencia');
  }

  // Combinamos los datos
  const resultado: AsistenciaConAlumno[] = alumnos.map(alumno => {
    const registroAsistencia = asistencia?.find(a => a.alumno_id === alumno.id);
    
    return {
      id: registroAsistencia?.id || '',
      alumno_id: alumno.id,
      alumno_nombre: alumno.nombre_completo,
      alumno_numero_lista: alumno.numero_lista,
      estado: registroAsistencia?.estado || 'presente', // Por defecto presente para nuevos registros
      notas: registroAsistencia?.notas,
      hora_registro: registroAsistencia?.hora_registro || new Date().toISOString()
    };
  });

  return resultado;
}

/**
 * Verifica si ya existe asistencia para un grupo en una fecha específica
 */
export async function verificarAsistenciaExiste(
  grupoId: string,
  fecha: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('asistencia')
      .select('id')
      .eq('grupo_id', grupoId)
      .eq('fecha', fecha)
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking attendance existence:', error);
    return false;
  }
}

export interface AsistenciaHistorial {
  fecha: string;
  total_alumnos: number;
  presentes: number;
  ausentes: number;
  retardos: number;
  justificados: number;
  porcentaje_asistencia: number;
}

/**
 * Obtiene el historial de asistencias de un grupo
 */
export async function getHistorialAsistenciaGrupo(
  grupoId: string,
  limite: number = 30
): Promise<AsistenciaHistorial[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('asistencia')
      .select('fecha, estado')
      .eq('grupo_id', grupoId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    
    // Agrupar por fecha y calcular estadísticas
    const fechasMap = new Map<string, {
      presentes: number;
      ausentes: number;
      retardos: number;
      justificados: number;
      total: number;
    }>();
    
    data?.forEach(registro => {
      const fecha = registro.fecha;
      if (!fechasMap.has(fecha)) {
        fechasMap.set(fecha, {
          presentes: 0,
          ausentes: 0,
          retardos: 0,
          justificados: 0,
          total: 0
        });
      }
      
      const stats = fechasMap.get(fecha)!;
      stats.total++;
      
      switch (registro.estado) {
        case 'presente':
          stats.presentes++;
          break;
        case 'ausente':
          stats.ausentes++;
          break;
        case 'retardo':
          stats.retardos++;
          break;
        case 'justificado':
          stats.justificados++;
          break;
      }
    });
    
    // Convertir a array y calcular porcentajes
    const historial: AsistenciaHistorial[] = Array.from(fechasMap.entries())
      .map(([fecha, stats]) => ({
        fecha,
        total_alumnos: stats.total,
        presentes: stats.presentes,
        ausentes: stats.ausentes,
        retardos: stats.retardos,
        justificados: stats.justificados,
        porcentaje_asistencia: stats.total > 0 
          ? Math.round(((stats.presentes + stats.retardos) / stats.total) * 100)
          : 0
      }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limite);
    
    return historial;
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    throw error;
  }
}

/**
 * Guarda o actualiza la asistencia de un alumno
 */
export async function guardarAsistenciaAlumno(
  alumnoId: string,
  grupoId: string,
  fecha: string,
  estado: EstadoAsistencia,
  notas?: string
): Promise<RegistroAsistencia> {
  const supabase = createClient();
  
  try {
    // Verificar si ya existe un registro
    const { data: existingRecord } = await supabase
      .from('asistencia')
      .select('id')
      .eq('alumno_id', alumnoId)
      .eq('grupo_id', grupoId)
      .eq('fecha', fecha)
      .single();
    
    if (existingRecord) {
      // Actualizar registro existente
      const { data, error } = await supabase
        .from('asistencia')
        .update({
          estado,
          notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Crear nuevo registro
      return await createAsistencia({
        alumno_id: alumnoId,
        grupo_id: grupoId,
        fecha,
        estado,
        notas
      });
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    throw error;
  }
}