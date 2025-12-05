import { supabase } from './supabase'

/**
 * Marca el tour guiado como visto para el usuario actual
 */
export async function markTourAsSeen(): Promise<boolean> {
    // 1. Guardar en localStorage siempre como respaldo inmediato
    if (typeof window !== 'undefined') {
        localStorage.setItem('tour_seen', 'true')
    }

    try {
        const { data, error } = await supabase.rpc('mark_tour_as_seen')

        if (error) {
            console.warn('Advertencia marcando tour como visto (usando fallback local):', error)
            return false
        }

        return data === true
    } catch (error) {
        console.warn('Advertencia inesperada marcando tour como visto:', error)
        return false
    }
}

/**
 * Verifica si el usuario actual ha visto el tour guiado
 */
export async function hasUserSeenTour(): Promise<boolean> {
    // 1. Verificar localStorage primero
    if (typeof window !== 'undefined') {
        const localSeen = localStorage.getItem('tour_seen')
        if (localSeen === 'true') return true
    }

    try {
        const { data, error } = await supabase.rpc('has_user_seen_tour')

        if (error) {
            console.warn('Advertencia verificando estado del tour (asumiendo visto para evitar bucle):', error)
            // En caso de error, asumir que YA vio el tour para no molestar
            return true
        }

        // Si la DB dice que sí, actualizar localStorage
        if (data === true && typeof window !== 'undefined') {
            localStorage.setItem('tour_seen', 'true')
        }

        return data === true
    } catch (error) {
        console.warn('Advertencia inesperada verificando tour:', error)
        // En caso de error, asumir que YA vio el tour
        return true
    }
}

/**
 * Resetea el estado del tour para el usuario actual
 */
export async function resetUserTour(targetUserId?: string): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('reset_user_tour', {
            target_user_id: targetUserId || null
        })

        if (error) {
            console.warn('Advertencia reseteando tour:', error)
            return false
        }

        return data === true
    } catch (error) {
        console.warn('Advertencia inesperada reseteando tour:', error)
        return false
    }
}
