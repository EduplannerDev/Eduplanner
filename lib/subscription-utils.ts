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
  proyectos_limit: number; // -1 = ilimitado
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
      mensajes_limit: -1, // Ilimitado
      proyectos_limit: -1 // Ilimitado
    };
  }
  
  return {
    planeaciones_limit: 5,
    examenes_limit: 2,
    mensajes_limit: 10,
    proyectos_limit: 1
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
  type: 'planeaciones' | 'examenes' | 'mensajes' | 'proyectos'
): Promise<{ canCreate: boolean; currentCount: number; limit: number; message?: string }> {
  console.log(`🔍 [LIMITS] Verificando límites para usuario ${userId}, tipo: ${type}`)
  console.log(`🔍 [LIMITS] ID del usuario completo: ${userId}`)
  
  try {
    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('❌ [LIMITS] Error obteniendo perfil:', profileError)
      throw new Error('No se pudo obtener el perfil del usuario');
    }
    
    console.log('✅ [LIMITS] Perfil obtenido:', { 
      subscription_plan: profile.subscription_plan, 
      subscription_status: profile.subscription_status 
    })
    
    const limits = getUserLimits(profile as Profile);
    console.log('📊 [LIMITS] Límites calculados:', limits)
    
    let currentCount = 0;
    let limit = 0;
    
    // Obtener el límite específico
    switch (type) {
      case 'planeaciones':
        limit = limits.planeaciones_limit;
        // Contar planeaciones creadas este mes desde planeacion_creations
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
        
        const { count: planeacionesCount } = await supabase
          .from('planeacion_creations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);
        currentCount = planeacionesCount || 0;
        break;
        
      case 'examenes':
        limit = limits.examenes_limit;
        // Contar exámenes creados lifetime desde exam_creations
        const { count: examenesCount } = await supabase
          .from('exam_creations')
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
        
      case 'proyectos':
        limit = limits.proyectos_limit;
        console.log(`📊 [LIMITS] Límite de proyectos: ${limit}`)
        
        // Primero obtener los registros completos para debuggear
        const { data: proyectosData, error: proyectosError } = await supabase
          .from('project_creations')
          .select('*')
          .eq('user_id', userId);
        
        if (proyectosError) {
          console.error('❌ [LIMITS] Error obteniendo proyectos:', proyectosError)
        }
        
        console.log(`🔍 [LIMITS] Registros encontrados en project_creations:`, proyectosData)
        console.log(`🔍 [LIMITS] Número de registros:`, proyectosData?.length || 0)
        
        // También verificar si hay proyectos en la tabla proyectos
        const { data: proyectosTabla, error: proyectosTablaError } = await supabase
          .from('proyectos')
          .select('id, nombre, created_at')
          .eq('profesor_id', userId);
        
        if (proyectosTablaError) {
          console.error('❌ [LIMITS] Error obteniendo proyectos de tabla proyectos:', proyectosTablaError)
        }
        
        console.log(`🔍 [LIMITS] Proyectos en tabla proyectos:`, proyectosTabla)
        console.log(`🔍 [LIMITS] Número de proyectos en tabla proyectos:`, proyectosTabla?.length || 0)
        
        currentCount = proyectosData?.length || 0;
        console.log(`📊 [LIMITS] Proyectos actuales (project_creations): ${currentCount}`)
        break;
    }
    
    // Si el límite es -1, es ilimitado
    const canCreate = limit === -1 || currentCount < limit;
    
    console.log(`🎯 [LIMITS] Resultado final:`, {
      type,
      currentCount,
      limit,
      canCreate,
      isUnlimited: limit === -1
    })
    
    return {
      canCreate,
      currentCount,
      limit,
      message: canCreate ? undefined : `Has alcanzado el límite de ${limit} ${type} para el plan gratuito`
    };
    
  } catch (error) {
    console.error('❌ [LIMITS] Error verificando límites del usuario:', error);
    return {
      canCreate: false,
      currentCount: 0,
      limit: 0,
      message: 'Error al verificar límites'
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
 * Verifica si un usuario puede crear un nuevo grupo
 */
export async function canUserCreateGroup(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  limit: number;
  message?: string;
}> {
  try {
    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error obteniendo perfil:', profileError);
      return {
        canCreate: false,
        currentCount: 0,
        limit: 0,
        message: 'Error al verificar permisos'
      };
    }

    // Verificar si es usuario Pro
    const isPro = isUserPro(profile);
    
    // Si es Pro, puede crear grupos ilimitados
    if (isPro) {
      const { count } = await supabase
        .from('group_creations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      return {
        canCreate: true,
        currentCount: count || 0,
        limit: -1 // Ilimitado
      };
    }

    // Para usuarios free, límite de 1 grupo
    const { count: gruposCount } = await supabase
      .from('group_creations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = gruposCount || 0;
    const limit = 1;
    const canCreate = currentCount < limit;

    return {
      canCreate,
      currentCount,
      limit,
      message: canCreate ? undefined : `Has alcanzado el límite de ${limit} grupo para el plan gratuito`
    };

  } catch (error) {
    console.error('Error verificando límites de grupos:', error);
    return {
      canCreate: false,
      currentCount: 0,
      limit: 0,
      message: 'Error al verificar límites'
    };
  }
}

/**
 * Obtiene estadísticas de uso de un usuario
 */
export async function getUserUsageStats(userId: string): Promise<{
  planeaciones: { count: number; limit: number };
  examenes: { count: number; limit: number };
  mensajes: { count: number; limit: number };
  grupos: { count: number; limit: number };
}> {
  const [planeaciones, examenes, mensajes, grupos] = await Promise.all([
    canUserCreate(userId, 'planeaciones'),
    canUserCreate(userId, 'examenes'),
    canUserCreate(userId, 'mensajes'),
    canUserCreateGroup(userId)
  ]);
  
  return {
    planeaciones: { count: planeaciones.currentCount, limit: planeaciones.limit },
    examenes: { count: examenes.currentCount, limit: examenes.limit },
    mensajes: { count: mensajes.currentCount, limit: mensajes.limit },
    grupos: { count: grupos.currentCount, limit: grupos.limit }
  };
}