import { supabase } from './supabase';

// Interfaces para las estadísticas
export interface PlatformStats {
  totalPlanteles: number;
  totalUsuarios: number;
  totalProfesores: number;
  totalDirectores: number;
  totalAdministradores: number;
  usuariosSinPlantel: number;
  usuariosConPlantel: number;
  totalGrupos: number;
  totalAlumnos: number;
  totalPlaneaciones: number;
  totalExamenes: number;
  totalMensajes: number;
  totalMensajesPadres: number;
}

export interface RecentActivity {
  nuevosUsuarios: number;
  nuevasPlaneaciones: number;
  nuevosExamenes: number;
  nuevosGrupos: number;
}

export interface SubscriptionStats {
  plantelesActivos: number;
  plantelesPendientes: number;
  plantelesVencidos: number;
  ingresosMensuales: number;
}

export interface TopPlanteles {
  id: string;
  nombre: string;
  totalUsuarios: number;
  totalGrupos: number;
  totalAlumnos: number;
  estado_suscripcion: string;
}

export interface UsuariosSinPlantel {
  totalUsuariosSinPlantel: number;
  profesoresSinPlantel: number;
  directoresSinPlantel: number;
  usuariosRecientesSinPlantel: number; // últimos 7 días
}

/**
 * Obtiene estadísticas generales de la plataforma
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    // Obtener estadísticas en paralelo
    const [
      plantelesResult,
      usuariosResult,
      usuariosConPlantelResult,
      gruposResult,
      planeacionesResult,
      examenesResult,
      mensajesResult,
      mensajesPadresResult
    ] = await Promise.all([
      // Total de planteles activos
      supabase
        .from('planteles')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true),
      
      // Total de usuarios por rol
      supabase
        .from('profiles')
        .select('role'),
      
      // Usuarios con plantel asignado
      supabase
        .from('user_plantel_assignments')
        .select('user_id', { count: 'exact', head: true })
        .eq('activo', true),
      
      // Total de grupos y alumnos
      supabase
        .from('grupos')
        .select('numero_alumnos')
        .eq('activo', true),
      
      // Total de planeaciones creadas
      supabase
        .from('planeacion_creations')
        .select('*', { count: 'exact', head: true }),
      
      // Total de exámenes
      supabase
        .from('examenes')
        .select('*', { count: 'exact', head: true }),
      
      // Total de mensajes
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true }),
      
      // Total de mensajes a padres
      supabase
        .from('parent_messages')
        .select('*', { count: 'exact', head: true })
    ]);

    // Procesar usuarios por rol
    const usuarios = usuariosResult.data || [];
    const totalUsuarios = usuarios.length;
    const totalProfesores = usuarios.filter(u => u.role === 'profesor').length;
    const totalDirectores = usuarios.filter(u => u.role === 'director').length;
    const totalAdministradores = usuarios.filter(u => u.role === 'administrador').length;

    // Calcular usuarios con y sin plantel
    const usuariosConPlantel = usuariosConPlantelResult.count || 0;
    const usuariosSinPlantel = totalUsuarios - usuariosConPlantel;

    // Procesar grupos y alumnos
    const grupos = gruposResult.data || [];
    const totalGrupos = grupos.length;
    const totalAlumnos = grupos.reduce((sum, grupo) => sum + (grupo.numero_alumnos || 0), 0);

    return {
      totalPlanteles: plantelesResult.count || 0,
      totalUsuarios,
      totalProfesores,
      totalDirectores,
      totalAdministradores,
      usuariosSinPlantel,
      usuariosConPlantel,
      totalGrupos,
      totalAlumnos,
      totalPlaneaciones: planeacionesResult.count || 0,
      totalExamenes: examenesResult.count || 0,
      totalMensajes: mensajesResult.count || 0,
      totalMensajesPadres: mensajesPadresResult.count || 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de la plataforma:', error);
    return {
      totalPlanteles: 0,
      totalUsuarios: 0,
      totalProfesores: 0,
      totalDirectores: 0,
      totalAdministradores: 0,
      usuariosSinPlantel: 0,
      usuariosConPlantel: 0,
      totalGrupos: 0,
      totalAlumnos: 0,
      totalPlaneaciones: 0,
      totalExamenes: 0,
      totalMensajes: 0,
      totalMensajesPadres: 0
    };
  }
}

/**
 * Obtiene actividad reciente (últimos 7 días)
 */
export async function getRecentActivity(): Promise<RecentActivity> {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    const fechaLimiteISO = fechaLimite.toISOString();

    const [
      nuevosUsuariosResult,
      nuevasPlaneacionesResult,
      nuevosExamenesResult,
      nuevosGruposResult
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fechaLimiteISO),
      
      supabase
        .from('planeacion_creations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fechaLimiteISO),
      
      supabase
        .from('examenes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fechaLimiteISO),
      
      supabase
        .from('grupos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fechaLimiteISO)
    ]);

    return {
      nuevosUsuarios: nuevosUsuariosResult.count || 0,
      nuevasPlaneaciones: nuevasPlaneacionesResult.count || 0,
      nuevosExamenes: nuevosExamenesResult.count || 0,
      nuevosGrupos: nuevosGruposResult.count || 0
    };
  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    return {
      nuevosUsuarios: 0,
      nuevasPlaneaciones: 0,
      nuevosExamenes: 0,
      nuevosGrupos: 0
    };
  }
}

/**
 * Obtiene estadísticas de suscripciones
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  try {
    const { data: planteles, error } = await supabase
      .from('planteles')
      .select('estado_suscripcion, plan_suscripcion')
      .eq('activo', true);

    if (error) {
      throw error;
    }

    const plantelesActivos = planteles?.filter(p => p.estado_suscripcion === 'active').length || 0;
    const plantelesPendientes = planteles?.filter(p => p.estado_suscripcion === 'trialing').length || 0;
    const plantelesVencidos = planteles?.filter(p => ['past_due', 'cancelled', 'unpaid'].includes(p.estado_suscripcion)).length || 0;

    // Calcular ingresos estimados (esto es una aproximación)
    const ingresosMensuales = plantelesActivos * 299; // Precio base estimado

    return {
      plantelesActivos,
      plantelesPendientes,
      plantelesVencidos,
      ingresosMensuales
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de suscripciones:', error);
    return {
      plantelesActivos: 0,
      plantelesPendientes: 0,
      plantelesVencidos: 0,
      ingresosMensuales: 0
    };
  }
}

/**
 * Obtiene los planteles más activos
 */
export async function getTopPlanteles(): Promise<TopPlanteles[]> {
  try {
    const { data: planteles, error } = await supabase
      .from('planteles')
      .select(`
        id,
        nombre,
        estado_suscripcion,
        user_plantel_assignments!inner(
          user_id
        )
      `)
      .eq('activo', true)
      .limit(5);

    if (error) {
      throw error;
    }

    // Para cada plantel, obtener estadísticas adicionales
    const plantelesConStats = await Promise.all(
      (planteles || []).map(async (plantel) => {
        const [gruposResult, usuariosResult] = await Promise.all([
          supabase
            .from('grupos')
            .select('numero_alumnos')
            .eq('plantel_id', plantel.id)
            .eq('activo', true),
          
          supabase
            .from('user_plantel_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('plantel_id', plantel.id)
            .eq('activo', true)
        ]);

        const grupos = gruposResult.data || [];
        const totalGrupos = grupos.length;
        const totalAlumnos = grupos.reduce((sum, grupo) => sum + (grupo.numero_alumnos || 0), 0);
        const totalUsuarios = usuariosResult.count || 0;

        return {
          id: plantel.id,
          nombre: plantel.nombre,
          totalUsuarios,
          totalGrupos,
          totalAlumnos,
          estado_suscripcion: plantel.estado_suscripcion || 'free'
        };
      })
    );

    // Ordenar por actividad (usuarios + grupos + alumnos)
    return plantelesConStats.sort((a, b) => {
      const scoreA = a.totalUsuarios + a.totalGrupos + a.totalAlumnos;
      const scoreB = b.totalUsuarios + b.totalGrupos + b.totalAlumnos;
      return scoreB - scoreA;
    });
  } catch (error) {
    console.error('Error obteniendo top planteles:', error);
    return [];
  }
}

/**
 * Obtiene información detallada de usuarios sin plantel
 */
export async function getUsuariosSinPlantel(): Promise<UsuariosSinPlantel> {
  try {
    // Obtener todos los usuarios
    const { data: todosUsuarios, error: usuariosError } = await supabase
      .from('profiles')
      .select('id, role, created_at');

    if (usuariosError) {
      throw usuariosError;
    }

    // Obtener usuarios con plantel asignado
    const { data: usuariosConPlantel, error: plantelError } = await supabase
      .from('user_plantel_assignments')
      .select('user_id')
      .eq('activo', true);

    if (plantelError) {
      throw plantelError;
    }

    // Crear set de IDs de usuarios con plantel para búsqueda rápida
    const idsConPlantel = new Set(usuariosConPlantel?.map(u => u.user_id) || []);

    // Filtrar usuarios sin plantel
    const usuariosSinPlantel = (todosUsuarios || []).filter(usuario => 
      !idsConPlantel.has(usuario.id)
    );

    // Calcular estadísticas
    const totalUsuariosSinPlantel = usuariosSinPlantel.length;
    const profesoresSinPlantel = usuariosSinPlantel.filter(u => u.role === 'profesor').length;
    const directoresSinPlantel = usuariosSinPlantel.filter(u => u.role === 'director').length;

    // Usuarios sin plantel de los últimos 7 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    const usuariosRecientesSinPlantel = usuariosSinPlantel.filter(u => 
      new Date(u.created_at) >= fechaLimite
    ).length;

    return {
      totalUsuariosSinPlantel,
      profesoresSinPlantel,
      directoresSinPlantel,
      usuariosRecientesSinPlantel
    };
  } catch (error) {
    console.error('Error obteniendo usuarios sin plantel:', error);
    return {
      totalUsuariosSinPlantel: 0,
      profesoresSinPlantel: 0,
      directoresSinPlantel: 0,
      usuariosRecientesSinPlantel: 0
    };
  }
}