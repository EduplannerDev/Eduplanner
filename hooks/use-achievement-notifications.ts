import { useEffect, useState } from 'react'
import { useAuth } from './use-auth'
import { supabase } from '@/lib/supabase'

interface NearAchievement {
    id: string
    title: string
    current: number
    requirement: number
    remaining: number
}

export function useAchievementNotifications() {
    const { user } = useAuth()
    const [hasNearAchievements, setHasNearAchievements] = useState(false)
    const [nearAchievements, setNearAchievements] = useState<NearAchievement[]>([])

    useEffect(() => {
        if (!user) return

        const checkAchievements = async () => {
            try {
                const stats = await getUserStats(user.id)
                const near: NearAchievement[] = []

                // Plan Analítico (3 fases)
                if (stats.plan_analitico < 3 && stats.plan_analitico >= 1) {
                    near.push({
                        id: 'arquitecto_plan_analitico',
                        title: 'Arquitecto del Plan Analítico',
                        current: stats.plan_analitico,
                        requirement: 3,
                        remaining: 3 - stats.plan_analitico
                    })
                }

                // Maestro CIME (10 planeaciones)
                if (stats.planeaciones < 10 && stats.planeaciones >= 7) {
                    near.push({
                        id: 'maestro_cime',
                        title: 'Maestro CIME/NEM',
                        current: stats.planeaciones,
                        requirement: 10,
                        remaining: 10 - stats.planeaciones
                    })
                }

                // Experto Dosificación (100%)
                if (stats.dosificacion < 100 && stats.dosificacion >= 80) {
                    near.push({
                        id: 'experto_dosificacion',
                        title: 'Experto en Dosificación',
                        current: stats.dosificacion,
                        requirement: 100,
                        remaining: 100 - stats.dosificacion
                    })
                }

                // Evaluador Estrella (10 total)
                if (stats.evaluacion < 10 && stats.evaluacion >= 7) {
                    near.push({
                        id: 'evaluador_estrella',
                        title: 'Evaluador Estrella',
                        current: stats.evaluacion,
                        requirement: 10,
                        remaining: 10 - stats.evaluacion
                    })
                }

                // Monitor Asistencia (30 días)
                if (stats.asistencia < 30 && stats.asistencia >= 25) {
                    near.push({
                        id: 'monitor_asistencia',
                        title: 'Monitor de Asistencia',
                        current: stats.asistencia,
                        requirement: 30,
                        remaining: 30 - stats.asistencia
                    })
                }

                // Enlace Familiar (30 mensajes)
                if (stats.mensajes < 30 && stats.mensajes >= 25) {
                    near.push({
                        id: 'enlace_familiar',
                        title: 'Enlace Familiar',
                        current: stats.mensajes,
                        requirement: 30,
                        remaining: 30 - stats.mensajes
                    })
                }

                setNearAchievements(near)
                setHasNearAchievements(near.length > 0)
            } catch (error) {
                console.error('Error checking achievements:', error)
            }
        }

        checkAchievements()

        // Revisar cada 5 minutos
        const interval = setInterval(checkAchievements, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [user])

    return { hasNearAchievements, nearAchievements }
}

async function getUserStats(userId: string) {
    // Plan Analítico: contar fases completadas
    const { count: planAnaliticoCount } = await supabase
        .from('plan_analitico')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completado', 'is', null)

    // Planeaciones CIME/NEM
    const { count: planeacionesCount } = await supabase
        .from('planeacion_creations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    // Dosificación: PDA vinculados
    const { count: dosificacionCount } = await supabase
        .from('dosificacion_contenidos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    // Evaluaciones: exámenes + rúbricas
    const { count: examenesCount } = await supabase
        .from('exam_creations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    const { count: rubricasCount } = await supabase
        .from('project_creations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    // Asistencia: días registrados en el mes actual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const { count: asistenciaCount } = await supabase
        .from('asistencia')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('fecha', startOfMonth.toISOString())

    // Mensajes generados
    const { count: mensajesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    return {
        plan_analitico: planAnaliticoCount || 0,
        planeaciones: planeacionesCount || 0,
        dosificacion: dosificacionCount || 0,
        evaluacion: (examenesCount || 0) + (rubricasCount || 0),
        asistencia: asistenciaCount || 0,
        mensajes: mensajesCount || 0
    }
}
