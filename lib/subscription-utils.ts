import { Profile } from './profile';
import { supabase } from './supabase';

// Tipos para los estados de suscripción
export type SubscriptionStatus = 
  | 'active' 
  | 'cancelled' 
  | 'cancelling' 
  | 'past_due' 
  | 'unpaid' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'trialing' 
  | 'paused';

export type SubscriptionPlan = 'free' | 'pro';

// Interface para límites de usuario
export interface UserLimits {
  planeaciones_limit: number; // -1 = ilimitado
  examenes_limit: number; // -1 = ilimitado
  mensajes_limit: number; // -1 = ilimitado
}

// Interface para información de suscripción
export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus | null;
  isActive: boolean;
  isPro: boolean;
  endDate: Date | null;
  renewDate: Date | null;
  cancelAtPeriodEnd: boolean;
  displayStatus: string;
}

/**
 * Verifica si un usuario tiene una suscripción Pro activa
 */
export function isUserPro(profile: Profile): boolean {
  return profile.subscription_plan === 'pro' && profile.subscription_status === 'active';
}

/**
 * Verifica si una suscripción está activa
 */
export function isSubscriptionActive(status: SubscriptionStatus | null): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Obtiene los límites de un usuario basado en su plan
 */
export function getUserLimits(profile: Profile): UserLimits {
  const isPro = isUserPro(profile);
  
  if (isPro) {
    return {
      planeaciones_limit: -1, // Ilimitado
      examenes_limit: -1, // Ilimitado
      mensajes_limit: -1 // Ilimitado
    };
  }
  
  return {
    planeaciones_limit: 5,
    examenes_limit: 3,
    mensajes_limit: 10
  };
}

/**
 * Obtiene información completa de la suscripción
 */
export function getSubscriptionInfo(profile: Profile): SubscriptionInfo {
  const plan = profile.subscription_plan;
  const status = profile.subscription_status;
  const isActive = isSubscriptionActive(status);
  const isPro = isUserPro(profile);
  const endDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null;
  const renewDate = profile.subscription_renew_date ? new Date(profile.subscription_renew_date) : null;
  const cancelAtPeriodEnd = profile.cancel_at_period_end;
  
  let displayStatus: string;
  
  if (plan === 'pro' && status === 'active') {
    displayStatus = 'Suscripción Pro Activa';
  } else if (plan === 'pro' && status === 'cancelled') {
    displayStatus = 'Suscripción Pro Cancelada';
  } else if (plan === 'pro' && status === 'past_due') {
    displayStatus = 'Suscripción Pro Vencida';
  } else if (plan === 'pro' && status === 'trialing') {
    displayStatus = 'Período de Prueba Pro';
  } else if (plan === 'pro' && status === 'cancelling') {
    displayStatus = 'Suscripción Pro Cancelándose';
  } else {
    displayStatus = 'Plan Gratuito';
  }
  
  return {
    plan,
    status,
    isActive,
    isPro,
    endDate,
    renewDate,
    cancelAtPeriodEnd,
    displayStatus
  };
}

/**
 * Verifica si un usuario puede crear más elementos basado en sus límites
 */
export async function canUserCreate(
  userId: string, 
  type: 'planeaciones' | 'examenes' | 'mensajes'
): Promise<{ canCreate: boolean; currentCount: number; limit: number }> {
  try {
    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      throw new Error('No se pudo obtener el perfil del usuario');
    }
    
    const limits = getUserLimits(profile as Profile);
    let currentCount = 0;
    let limit = 0;
    
    // Obtener el límite específico
    switch (type) {
      case 'planeaciones':
        limit = limits.planeaciones_limit;
        // Contar planeaciones actuales
        const { count: planeacionesCount } = await supabase
          .from('planeaciones')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        currentCount = planeacionesCount || 0;
        break;
        
      case 'examenes':
        limit = limits.examenes_limit;
        // Contar exámenes actuales
        const { count: examenesCount } = await supabase
          .from('examenes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        currentCount = examenesCount || 0;
        break;
        
      case 'mensajes':
        limit = limits.mensajes_limit;
        // Contar mensajes actuales del día
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { count: mensajesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());
        currentCount = mensajesCount || 0;
        break;
    }
    
    // Si el límite es -1, es ilimitado
    const canCreate = limit === -1 || currentCount < limit;
    
    return {
      canCreate,
      currentCount,
      limit
    };
    
  } catch (error) {
    console.error('Error verificando límites del usuario:', error);
    return {
      canCreate: false,
      currentCount: 0,
      limit: 0
    };
  }
}

/**
 * Actualiza la información de suscripción de un usuario
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    subscription_plan?: SubscriptionPlan;
    subscription_status?: SubscriptionStatus | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    stripe_price_id?: string | null;
    subscription_end_date?: string | null;
    subscription_renew_date?: string | null;
    cancel_at_period_end?: boolean;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...subscriptionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error actualizando suscripción:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error actualizando suscripción:', error);
    return false;
  }
}

/**
 * Cancela una suscripción (marca para cancelar al final del período)
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
  return updateUserSubscription(userId, {
    cancel_at_period_end: true,
    subscription_status: 'cancelling'
  });
}

/**
 * Reactiva una suscripción cancelada
 */
export async function reactivateSubscription(userId: string): Promise<boolean> {
  return updateUserSubscription(userId, {
    cancel_at_period_end: false,
    subscription_status: 'active'
  });
}

/**
 * Obtiene estadísticas de uso de un usuario
 */
export async function getUserUsageStats(userId: string): Promise<{
  planeaciones: { count: number; limit: number };
  examenes: { count: number; limit: number };
  mensajes: { count: number; limit: number };
}> {
  const [planeaciones, examenes, mensajes] = await Promise.all([
    canUserCreate(userId, 'planeaciones'),
    canUserCreate(userId, 'examenes'),
    canUserCreate(userId, 'mensajes')
  ]);
  
  return {
    planeaciones: { count: planeaciones.currentCount, limit: planeaciones.limit },
    examenes: { count: examenes.currentCount, limit: examenes.limit },
    mensajes: { count: mensajes.currentCount, limit: mensajes.limit }
  };
}