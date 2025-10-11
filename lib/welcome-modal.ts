import { supabase } from './supabase'

/**
 * Marca el modal de bienvenida como visto para el usuario actual
 */
export async function markWelcomeModalAsSeen(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('mark_welcome_modal_as_seen')
    
    if (error) {
      console.error('Error marcando modal como visto:', error)
      return false
    }
    
    return data === true
  } catch (error) {
    console.error('Error inesperado marcando modal como visto:', error)
    return false
  }
}

/**
 * Verifica si el usuario actual ha visto el modal de bienvenida
 */
export async function hasUserSeenWelcomeModal(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_user_seen_welcome_modal')
    
    if (error) {
      console.error('Error verificando estado del modal:', error)
      // En caso de error, asumir que no ha visto el modal para mostrarlo
      return false
    }
    
    return data === true
  } catch (error) {
    console.error('Error inesperado verificando modal:', error)
    // En caso de error, asumir que no ha visto el modal para mostrarlo
    return false
  }
}

/**
 * Resetea el estado del modal de bienvenida para el usuario actual
 * Solo funciona para administradores
 */
export async function resetUserWelcomeModal(targetUserId?: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('reset_user_welcome_modal', {
      target_user_id: targetUserId || null
    })
    
    if (error) {
      console.error('Error reseteando modal:', error)
      return false
    }
    
    return data === true
  } catch (error) {
    console.error('Error inesperado reseteando modal:', error)
    return false
  }
}

/**
 * Obtiene información detallada del estado del modal para el usuario actual
 */
export async function getWelcomeModalStatus(): Promise<{
  hasSeen: boolean
  firstSeenAt: string | null
  lastSeenAt: string | null
} | null> {
  try {
    const { data, error } = await supabase
      .from('user_welcome_modal')
      .select('has_seen_welcome_modal, first_seen_at, last_seen_at')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró registro, significa que no ha visto el modal
        return {
          hasSeen: false,
          firstSeenAt: null,
          lastSeenAt: null
        }
      }
      console.error('Error obteniendo estado del modal:', error)
      return null
    }
    
    return {
      hasSeen: data.has_seen_welcome_modal,
      firstSeenAt: data.first_seen_at,
      lastSeenAt: data.last_seen_at
    }
  } catch (error) {
    console.error('Error inesperado obteniendo estado del modal:', error)
    return null
  }
}
