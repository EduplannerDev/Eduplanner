import { supabase } from './supabase';
import { Plantel, UserPlantelAssignment, UserRole } from './profile';

// Tipos para límites de planteles
export interface PlantelLimits {
  total_usuarios: number;
  total_profesores: number;
  total_directores: number;
  total_administradores: number;
}

export interface PlantelWithLimits extends Plantel {
  max_usuarios?: number;
  max_profesores?: number;
  max_directores?: number;
  plan_suscripcion?: string;
  estado_suscripcion?: string;
  fecha_vencimiento?: string;
  usuarios_actuales?: number;
  profesores_actuales?: number;
  directores_actuales?: number;
  administradores_actuales?: number;
  usuarios_disponibles?: number;
  profesores_disponibles?: number;
  directores_disponibles?: number;
  suscripcion_vigente?: boolean;
}

// =====================================================
// FUNCIONES PARA GESTIÓN DE PLANTELES
// =====================================================

// Obtener todos los planteles (solo administradores)
export async function getAllPlanteles(): Promise<Plantel[]> {
  try {
    const { data, error } = await supabase
      .from('planteles')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error fetching planteles:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getAllPlanteles:', (error as Error).message);
    return [];
  }
}

// Obtener plantel por ID
export async function getPlantelById(plantelId: string): Promise<Plantel | null> {
  try {
    const { data, error } = await supabase
      .from('planteles')
      .select('*')
      .eq('id', plantelId)
      .single();

    if (error) {
      console.error('Error fetching plantel:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in getPlantelById:', (error as Error).message);
    return null;
  }
}

// Crear nuevo plantel (solo administradores)
export async function createPlantel(plantelData: Omit<Plantel, 'id' | 'created_at' | 'updated_at'>): Promise<Plantel | null> {
  try {
    const { data, error } = await supabase
      .from('planteles')
      .insert([plantelData])
      .select()
      .single();

    if (error) {
      console.error('Error creating plantel:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in createPlantel:', (error as Error).message);
    return null;
  }
}

// Actualizar plantel (solo administradores)
export async function updatePlantel(plantelId: string, updates: Partial<Plantel>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('planteles')
      .update(updates)
      .eq('id', plantelId);

    if (error) {
      console.error('Error updating plantel:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in updatePlantel:', (error as Error).message);
    return false;
  }
}

// Desactivar plantel (soft delete)
export async function deactivatePlantel(plantelId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('planteles')
      .update({ activo: false })
      .eq('id', plantelId);

    if (error) {
      console.error('Error deactivating plantel:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in deactivatePlantel:', (error as Error).message);
    return false;
  }
}

// =====================================================
// FUNCIONES PARA ASIGNACIONES DE PLANTELES
// =====================================================

// Asignar usuario a plantel
export async function assignUserToPlantel(
  userId: string,
  plantelId: string,
  role: UserRole,
  assignedBy?: string
): Promise<UserPlantelAssignment | null> {
  try {
    const { data, error } = await supabase
      .from('user_plantel_assignments')
      .insert([{
        user_id: userId,
        plantel_id: plantelId,
        role,
        assigned_by: assignedBy
      }])
      .select()
      .single();

    if (error) {
      console.error('Error assigning user to plantel:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in assignUserToPlantel:', (error as Error).message);
    return null;
  }
}

// Obtener asignaciones de un usuario
export async function getUserPlantelAssignments(userId: string): Promise<UserPlantelAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('user_plantel_assignments')
      .select(`
        *,
        plantel:planteles(*)
      `)
      .eq('user_id', userId)
      .eq('activo', true);

    if (error) {
      console.error('Error fetching user assignments:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getUserPlantelAssignments:', (error as Error).message);
    return [];
  }
}

// Obtener usuarios asignados a un plantel
export async function getPlantelUsers(plantelId: string): Promise<UserPlantelAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('user_plantel_assignments')
      .select(`
        *,
        profiles!user_plantel_assignments_user_id_fkey(*)
      `)
      .eq('plantel_id', plantelId)
      .eq('activo', true)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching plantel users:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getPlantelUsers:', (error as Error).message);
    return [];
  }
}

// Remover asignación de usuario a plantel
export async function removeUserFromPlantel(userId: string, plantelId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_plantel_assignments')
      .update({ activo: false })
      .eq('user_id', userId)
      .eq('plantel_id', plantelId);

    if (error) {
      console.error('Error removing user from plantel:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in removeUserFromPlantel:', (error as Error).message);
    return false;
  }
}

// Actualizar rol de usuario en plantel
export async function updateUserRoleInPlantel(
  userId: string,
  plantelId: string,
  newRole: UserRole
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_plantel_assignments')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('plantel_id', plantelId)
      .eq('activo', true);

    if (error) {
      console.error('Error updating user role in plantel:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in updateUserRoleInPlantel:', (error as Error).message);
    return false;
  }
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

// Verificar si un usuario tiene un rol específico en un plantel
export async function userHasRoleInPlantel(
  userId: string,
  plantelId: string,
  role: UserRole
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_plantel_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('plantel_id', plantelId)
      .eq('role', role)
      .eq('activo', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking user role:', error.message);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception in userHasRoleInPlantel:', (error as Error).message);
    return false;
  }
}

// Obtener el plantel principal de un usuario (desde su perfil)
export async function getUserMainPlantel(userId: string): Promise<Plantel | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        plantel:planteles(*)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user main plantel:', error.message);
      return null;
    }

    return data?.plantel || null;
  } catch (error) {
    console.error('Exception in getUserMainPlantel:', (error as Error).message);
    return null;
  }
}

// Verificar si un usuario es administrador
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking if user is admin:', error.message);
      return false;
    }

    return data?.role === 'administrador';
  } catch (error) {
    console.error('Exception in isUserAdmin:', (error as Error).message);
    return false;
  }
}

// Verificar si un usuario es director de un plantel
export async function isUserDirectorOfPlantel(userId: string, plantelId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, plantel_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking if user is director:', error.message);
      return false;
    }

    return data?.role === 'director' && data?.plantel_id === plantelId;
  } catch (error) {
    console.error('Exception in isUserDirectorOfPlantel:', (error as Error).message);
    return false;
  }
}

// =====================================================
// FUNCIONES PARA LÍMITES DE USUARIOS
// =====================================================

// Obtener conteo actual de usuarios por plantel
export async function getPlantelUserCount(plantelId: string): Promise<PlantelLimits | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_plantel_user_count', { plantel_id: plantelId });

    if (error) {
      console.error('Error getting plantel user count:', error.message);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in getPlantelUserCount:', (error as Error).message);
    return null;
  }
}

// Verificar si se puede agregar un usuario al plantel
export async function canAddUserToPlantel(plantelId: string, userRole: UserRole): Promise<boolean> {
  try {
    // Obtener información del plantel con límites
    const plantelInfo = await getPlantelWithLimits(plantelId);
    
    if (!plantelInfo || plantelInfo.estado_suscripcion !== 'activa') {
      return false;
    }

    // Verificar límite total de usuarios
    if ((plantelInfo.usuarios_actuales || 0) >= (plantelInfo.max_usuarios || 0)) {
      return false;
    }

    // Verificar límites específicos por rol
    switch (userRole) {
      case 'profesor':
        return (plantelInfo.profesores_actuales || 0) < (plantelInfo.max_profesores || 0);
      case 'director':
        return (plantelInfo.directores_actuales || 0) < (plantelInfo.max_directores || 0);
      case 'administrador':
        // Los administradores no tienen límite específico por plantel
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error('Exception in canAddUserToPlantel:', (error as Error).message);
    return false;
  }
}

// Obtener información completa del plantel con límites
export async function getPlantelWithLimits(plantelId: string): Promise<PlantelWithLimits | null> {
  try {
    const { data, error } = await supabase
      .from('planteles_with_limits')
      .select('*')
      .eq('id', plantelId)
      .single();

    if (error) {
      console.error('Error getting plantel with limits:', error.message);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Exception in getPlantelWithLimits:', (error as Error).message);
    return null;
  }
}

// Obtener todos los planteles con información de límites
export async function getAllPlantelesWithLimits(): Promise<PlantelWithLimits[]> {
  try {
    const { data, error } = await supabase
      .from('planteles_with_limits')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error fetching planteles with limits:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getAllPlantelesWithLimits:', (error as Error).message);
    return [];
  }
}

// Actualizar límites de un plantel
export async function updatePlantelLimits(
  plantelId: string, 
  limits: {
    max_usuarios?: number;
    max_profesores?: number;
    max_directores?: number;
    plan_suscripcion?: string;
    estado_suscripcion?: string;
    fecha_vencimiento?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('planteles')
      .update(limits)
      .eq('id', plantelId);

    if (error) {
      console.error('Error updating plantel limits:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in updatePlantelLimits:', (error as Error).message);
    return false;
  }
}

// Asignar usuario a plantel con validación de límites
export async function assignUserToPlantelWithValidation(
  userId: string,
  plantelId: string,
  role: UserRole,
  assignedBy?: string
): Promise<{ success: boolean; error?: string; data?: UserPlantelAssignment }> {
  try {
    // Primero verificar si se puede agregar el usuario
    const canAdd = await canAddUserToPlantel(plantelId, role);
    
    if (!canAdd) {
      return {
        success: false,
        error: 'No se puede agregar el usuario. Se ha alcanzado el límite máximo para este plantel.'
      };
    }

    // Si se puede agregar, proceder con la asignación
    const assignment = await assignUserToPlantel(userId, plantelId, role, assignedBy);
    
    if (!assignment) {
      return {
        success: false,
        error: 'Error al asignar el usuario al plantel.'
      };
    }

    return {
      success: true,
      data: assignment
    };
  } catch (error) {
    console.error('Exception in assignUserToPlantelWithValidation:', (error as Error).message);
    return {
      success: false,
      error: 'Error interno al asignar el usuario.'
    };
  }
}