export interface PromedioGeneralData {
    promedio: number
    tendencia: 'up' | 'down' | 'neutral'
    estudiantesEnRiesgo: number
    totalEstudiantes: number
    grupoMejor: { nombre: string; promedio: number } | null
    grupoPeor: { nombre: string; promedio: number } | null
}

export interface CalificacionesPendientesData {
    actividadesPendientes: number
    actividadesVencidas: number
    porcentajeCalificado: number
    gruposConAtraso: Array<{ grupo: string; pendientes: number }>
}

export interface ActividadProxima {
    id: string
    nombre: string
    tipo: string
    grupo: string
    fechaEntrega: string
    diasRestantes: number
}

export interface DistribucionActividades {
    examen: number
    tarea: number
    proyecto: number
    participacion: number
    otro: number
}

/**
 * Obtiene el promedio general del plantel y métricas relacionadas
 */
export async function getPromedioGeneralPlantel(plantelId: string): Promise<PromedioGeneralData> {
    try {
        const response = await fetch(`/api/dashboard/promedio-general?plantelId=${plantelId}`)
        if (!response.ok) {
            throw new Error('Failed to fetch promedio general')
        }
        return await response.json()
    } catch (error) {
        console.error('Error fetching promedio general:', error)
        return {
            promedio: 0,
            tendencia: 'neutral',
            estudiantesEnRiesgo: 0,
            totalEstudiantes: 0,
            grupoMejor: null,
            grupoPeor: null
        }
    }
}

/**
 * Obtiene información sobre calificaciones pendientes
 */
export async function getCalificacionesPendientes(plantelId: string): Promise<CalificacionesPendientesData> {
    // TODO: Implement API route
    return {
        actividadesPendientes: 0,
        actividadesVencidas: 0,
        porcentajeCalificado: 100,
        gruposConAtraso: []
    }
}

/**
 * Obtiene actividades próximas a vencer (próximos 7 días)
 */
export async function getActividadesProximas(plantelId: string): Promise<ActividadProxima[]> {
    // TODO: Implement API route
    return []
}

/**
 * Obtiene la distribución de actividades por tipo
 */
export async function getDistribucionActividades(plantelId: string): Promise<DistribucionActividades> {
    // TODO: Implement API route
    return { examen: 0, tarea: 0, proyecto: 0, participacion: 0, otro: 0 }
}
