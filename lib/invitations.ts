import { supabase } from './supabase';

export interface InvitationStatus {
  hasInvitations: boolean;
  plantelCount: number;
  primaryPlantelId: string | null;
  primaryPlantelName: string | null;
  primaryRole: string | null;
}

/**
 * Verifica el estado de invitaciones de un usuario
 */
export async function checkInvitationStatus(userId: string): Promise<InvitationStatus | null> {
  try {
    const { data, error } = await supabase
      .rpc('check_invitation_status', { user_id_param: userId });

    if (error) {
      console.error('Error checking invitation status:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        hasInvitations: false,
        plantelCount: 0,
        primaryPlantelId: null,
        primaryPlantelName: null,
        primaryRole: null
      };
    }

    const result = data[0];
    return {
      hasInvitations: result.has_invitations || false,
      plantelCount: result.plantel_count || 0,
      primaryPlantelId: result.primary_plantel_id || null,
      primaryPlantelName: result.primary_plantel_name || null,
      primaryRole: result.primary_role || null
    };
  } catch (error) {
    console.error('Exception in checkInvitationStatus:', error);
    return null;
  }
}

/**
 * Procesa una invitación aceptada (para casos donde el trigger no funcionó)
 */
export async function processAcceptedInvitation(
  userId: string,
  plantelId: string,
  role: string,
  invitedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si ya existe la asignación
    const { data: existing } = await supabase
      .from('user_plantel_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('plantel_id', plantelId)
      .single();

    if (existing) {
      return { success: true }; // Ya existe
    }

    // Crear la asignación
    const { error } = await supabase
      .from('user_plantel_assignments')
      .insert([{
        user_id: userId,
        plantel_id: plantelId,
        role: role,
        assigned_by: invitedBy,
        activo: true,
        assigned_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error creating plantel assignment:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in processAcceptedInvitation:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Obtiene las invitaciones pendientes de un usuario por email
 */
export async function getPendingInvitations(email: string): Promise<any[]> {
  try {
    // Esta función requeriría acceso a auth.users que normalmente no está disponible
    // desde el cliente. Se podría implementar como una función RPC en el servidor
    console.warn('getPendingInvitations requires server-side implementation');
    return [];
  } catch (error) {
    console.error('Exception in getPendingInvitations:', error);
    return [];
  }
}

/**
 * Valida si un usuario puede ser invitado a un plantel
 */
export async function validateInvitation(
  email: string,
  plantelId: string,
  role: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Verificar si el email ya está registrado
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Verificar si ya está asignado al plantel
      const { data: assignment } = await supabase
        .from('user_plantel_assignments')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('plantel_id', plantelId)
        .single();

      if (assignment) {
        return { valid: false, error: 'El usuario ya está asignado a este plantel' };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Exception in validateInvitation:', error);
    return { valid: false, error: (error as Error).message };
  }
}