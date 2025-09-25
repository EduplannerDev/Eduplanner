import { supabase } from './supabase';

// Interfaces para las estadísticas del director
export interface DirectorDashboardStats {
  profesoresActivos: number;
  totalProfesores: number;
  planeacionesCreadas: number;
  proyectosIniciados: number;
  recursosCompartidos: number;
  licenciasActivas: number;
}

export interface TeacherActivity {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  planeaciones: number;
  proyectos: number;
  notasSeguimiento: number;
  plantillasCompartidas: number;
  ultimaActividad: string;
}

export interface PlatformPulse {
  stats: DirectorDashboardStats;
  teacherActivity: TeacherActivity[];
  periodInfo: {
    mesActual: string;
    semanaActual: string;
  };
}

/**
 * Obtiene las estadísticas principales para el dashboard del director
 */
export async function getDirectorDashboardStats(plantelId: string): Promise<DirectorDashboardStats> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Obtener profesores del plantel
    const { data: profesores, error: profesoresError } = await supabase
      .from('profiles')
      .select('id, activo')
      .eq('plantel_id', plantelId)
      .eq('role', 'profesor');

    if (profesoresError) {
      console.error('Error obteniendo profesores:', profesoresError);
      throw profesoresError;
    }

    const totalProfesores = profesores?.length || 0;
    const profesoresActivos = profesores?.filter(p => p.activo)?.length || 0;

    // Si no hay profesores, retornar estadísticas vacías
    if (totalProfesores === 0) {
      return {
        profesoresActivos: 0,
        totalProfesores: 0,
        planeacionesCreadas: 0,
        proyectosIniciados: 0,
        recursosCompartidos: 0,
        licenciasActivas: 0
      };
    }

    const profesorIds = profesores.map(p => p.id);

    // Obtener planeaciones creadas este mes por profesores del plantel
    console.log('📝 getDirectorDashboardStats: Consultando planeaciones para profesores:', profesorIds);
    console.log('📝 getDirectorDashboardStats: Fecha inicio del mes:', startOfMonth.toISOString());
    
    const { data: planeaciones, error: planeacionesError } = await supabase
      .from('planeaciones')
      .select('id, user_id, created_at, titulo')
      .gte('created_at', startOfMonth.toISOString())
      .in('user_id', profesorIds)
      .is('deleted_at', null);

    console.log('📝 getDirectorDashboardStats: Resultado planeaciones:', { data: planeaciones, error: planeacionesError });

    if (planeacionesError) {
      console.error('❌ getDirectorDashboardStats: Error obteniendo planeaciones:', planeacionesError);
      // No lanzar error, solo usar 0
    }

    // Obtener proyectos iniciados este mes
    const { data: proyectos, error: proyectosError } = await supabase
      .from('proyectos')
      .select('id, profesor_id')
      .gte('created_at', startOfMonth.toISOString())
      .in('profesor_id', profesorIds);

    if (proyectosError) {
      console.error('Error obteniendo proyectos:', proyectosError);
      // No lanzar error, solo usar 0
    }

    // Obtener recursos compartidos (planeaciones compartidas del plantel)
    const { data: recursos, error: recursosError } = await supabase
      .from('planeaciones')
      .select('id')
      .in('user_id', profesorIds)
      .eq('estado', 'completada');

    if (recursosError) {
      console.error('Error obteniendo recursos:', recursosError);
      // No lanzar error, solo usar 0
    }

    // Calcular licencias activas (profesores activos esta semana)
    const { data: actividadSemanal, error: actividadError } = await supabase
      .from('planeaciones')
      .select('user_id')
      .gte('created_at', startOfWeek.toISOString())
      .in('user_id', profesorIds)
      .is('deleted_at', null);

    if (actividadError) {
      console.error('Error obteniendo actividad semanal:', actividadError);
      // No lanzar error, solo usar 0
    }

    const licenciasActivas = new Set(actividadSemanal?.map(a => a.user_id) || []).size;

    return {
      profesoresActivos,
      totalProfesores,
      planeacionesCreadas: planeaciones?.length || 0,
      proyectosIniciados: proyectos?.length || 0,
      recursosCompartidos: recursos?.length || 0,
      licenciasActivas
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas del director:', error);
    // Retornar estadísticas vacías en lugar de lanzar error
    return {
      profesoresActivos: 0,
      totalProfesores: 0,
      planeacionesCreadas: 0,
      proyectosIniciados: 0,
      recursosCompartidos: 0,
      licenciasActivas: 0
    };
  }
}

/**
 * Obtiene la actividad de los profesores en la última semana
 */
export async function getTeacherActivity(plantelId: string): Promise<TeacherActivity[]> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Obtener profesores del plantel
    const { data: profesores, error: profesoresError } = await supabase
      .from('profiles')
      .select('id, full_name, email, activo')
      .eq('plantel_id', plantelId)
      .eq('role', 'profesor')
      .eq('activo', true)
      .order('full_name');

    if (profesoresError) throw profesoresError;

    if (!profesores || profesores.length === 0) {
      return [];
    }

    const profesorIds = profesores.map(p => p.id);
    console.log('Profesores encontrados:', profesores.map(p => ({ id: p.id, email: p.email, full_name: p.full_name })));
    console.log('Fecha de inicio del mes:', startOfMonth.toISOString());

    // Obtener actividad del mes en paralelo con manejo de errores individual
    const planeacionesRes = await supabase
      .from('planeaciones')
      .select('user_id')
      .gte('created_at', startOfMonth.toISOString())
      .in('user_id', profesorIds)
      .is('deleted_at', null);

    if (planeacionesRes.error) {
      console.error('Error en consulta planeacion_creations:', planeacionesRes.error);
    } else {
      console.log('Planeaciones encontradas:', planeacionesRes.data?.length, planeacionesRes.data);
    }

    const proyectosRes = await supabase
      .from('proyectos')
      .select('profesor_id')
      .gte('created_at', startOfMonth.toISOString())
      .in('profesor_id', profesorIds);

    if (proyectosRes.error) {
      console.error('Error en consulta proyectos:', proyectosRes.error);
    }

    const notasRes = await supabase
      .from('messages')
      .select('user_id')
      .gte('created_at', startOfMonth.toISOString())
      .in('user_id', profesorIds);

    if (notasRes.error) {
      console.error('Error en consulta messages:', notasRes.error);
    }

    const plantillasRes = await supabase
      .from('planeaciones')
      .select('user_id')
      .gte('updated_at', startOfMonth.toISOString())
      .eq('estado', 'completada')
      .in('user_id', profesorIds);

    if (plantillasRes.error) {
      console.error('Error en consulta planeaciones:', plantillasRes.error);
    }

    // Procesar resultados y crear contadores por usuario
    const activityCounters: Record<string, {
      planeaciones: number;
      proyectos: number;
      notas: number;
      plantillas: number;
      ultimaActividad: string;
    }> = {};

    // Inicializar contadores
    profesorIds.forEach(id => {
      activityCounters[id] = {
        planeaciones: 0,
        proyectos: 0,
        notas: 0,
        plantillas: 0,
        ultimaActividad: ''
      };
    });

    // Contar planeaciones
    planeacionesRes.data?.forEach(item => {
      if (activityCounters[item.user_id]) {
        activityCounters[item.user_id].planeaciones++;
      }
    });

    // Contar proyectos
    proyectosRes.data?.forEach(item => {
      if (activityCounters[item.profesor_id]) {
        activityCounters[item.profesor_id].proyectos++;
      }
    });

    // Contar notas
    notasRes.data?.forEach(item => {
      if (activityCounters[item.user_id]) {
        activityCounters[item.user_id].notas++;
      }
    });

    // Contar plantillas
    plantillasRes.data?.forEach(item => {
      if (activityCounters[item.user_id]) {
        activityCounters[item.user_id].plantillas++;
      }
    });

    // Obtener última actividad para cada profesor
    for (const profesor of profesores) {
      const { data: ultimaActividad } = await supabase
        .from('planeaciones')
        .select('created_at')
        .eq('user_id', profesor.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (ultimaActividad && ultimaActividad.length > 0) {
        activityCounters[profesor.id].ultimaActividad = ultimaActividad[0].created_at;
      }
    }

    // Construir resultado final
    const teacherActivity: TeacherActivity[] = profesores.map(profesor => {
      // Dividir full_name en nombre y apellido
      const fullName = profesor.full_name || '';
      const nameParts = fullName.split(' ');
      const nombre = nameParts[0] || '';
      const apellido = nameParts.slice(1).join(' ') || '';
      
      return {
        id: profesor.id,
        nombre,
        apellido,
        email: profesor.email || '',
        planeaciones: activityCounters[profesor.id].planeaciones,
        proyectos: activityCounters[profesor.id].proyectos,
        notasSeguimiento: activityCounters[profesor.id].notas,
        plantillasCompartidas: activityCounters[profesor.id].plantillas,
        ultimaActividad: activityCounters[profesor.id].ultimaActividad
      };
    });

    // Ordenar por actividad total (descendente)
    return teacherActivity.sort((a, b) => {
      const activityA = a.planeaciones + a.proyectos + a.notasSeguimiento + a.plantillasCompartidas;
      const activityB = b.planeaciones + b.proyectos + b.notasSeguimiento + b.plantillasCompartidas;
      return activityB - activityA;
    });

  } catch (error) {
    console.error('Error obteniendo actividad de profesores:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    // Retornar array vacío en lugar de lanzar error para evitar que se rompa el dashboard
    return [];
  }
}

/**
 * Obtiene el pulso completo de la plataforma para el director
 */
export async function getPlatformPulse(plantelId: string): Promise<PlatformPulse> {
  try {
    console.log('🚀 getPlatformPulse: Iniciando para plantel:', plantelId);
    
    // Ejecutar las funciones de forma individual para mejor manejo de errores
    let stats: DirectorDashboardStats;
    let teacherActivity: TeacherActivity[];

    try {
      console.log('📊 getPlatformPulse: Obteniendo estadísticas del director...');
      stats = await getDirectorDashboardStats(plantelId);
      console.log('📊 getPlatformPulse: Estadísticas obtenidas:', stats);
    } catch (error) {
      console.error('❌ getPlatformPulse: Error obteniendo estadísticas del director:', error);
      stats = {
        profesoresActivos: 0,
        totalProfesores: 0,
        planeacionesCreadas: 0,
        proyectosIniciados: 0,
        recursosCompartidos: 0,
        licenciasActivas: 0
      };
    }

    try {
      console.log('👥 getPlatformPulse: Obteniendo actividad de profesores...');
      teacherActivity = await getTeacherActivity(plantelId);
      console.log('👥 getPlatformPulse: Actividad de profesores obtenida:', teacherActivity);
    } catch (error) {
      console.error('❌ getPlatformPulse: Error obteniendo actividad de profesores:', error);
      teacherActivity = [];
    }

    const now = new Date();
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    return {
      stats,
      teacherActivity,
      periodInfo: {
        mesActual: meses[now.getMonth()],
        semanaActual: `Semana del ${now.getDate() - now.getDay()} al ${now.getDate() - now.getDay() + 6}`
      }
    };

  } catch (error) {
    console.error('Error obteniendo pulso de la plataforma:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Retornar valores por defecto en lugar de lanzar error
    return {
      stats: {
        profesoresActivos: 0,
        totalProfesores: 0,
        planeacionesCreadas: 0,
        proyectosIniciados: 0,
        recursosCompartidos: 0,
        licenciasActivas: 0
      },
      teacherActivity: [],
      periodInfo: {
        mesActual: 'enero',
        semanaActual: 'Semana actual'
      }
    };
  }
}