"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Trophy,
    Medal,
    Award,
    BookOpen,
    BarChart3,
    ClipboardCheck,
    Users,
    MessageCircle,
    Lock,
    CheckCircle2,
    Sparkles
} from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    requirement: number
    current: number
    unlocked: boolean
    category: 'plan_analitico' | 'planeaciones' | 'dosificacion' | 'evaluacion' | 'asistencia' | 'mensajes'
    color: string
}

const achievementDefinitions = [
    {
        id: 'arquitecto_plan_analitico',
        title: '🥇 Arquitecto del Plan Analítico',
        description: 'Completa las 3 fases del Plan Analítico (Diagnóstico, Contextualización y Codiseño)',
        requirement: 3,
        category: 'plan_analitico' as const,
        color: 'from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30',
        borderColor: 'border-yellow-300 dark:border-yellow-700',
        value: 'Dominio Curricular Total: Construye el cerebro pedagógico de todo tu año escolar'
    },
    {
        id: 'maestro_cime',
        title: '🥈 Maestro CIME / NEM',
        description: 'Genera 10 planeaciones usando metodologías CIME o NEM',
        requirement: 10,
        category: 'planeaciones' as const,
        color: 'from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30',
        borderColor: 'border-gray-300 dark:border-gray-600',
        value: 'Maestría en Metodologías: Domina las estrategias del Nuevo Modelo Educativo'
    },
    {
        id: 'experto_dosificacion',
        title: '🥉 Experto en Dosificación',
        description: 'Vincula el 100% de los contenidos (PDA) del mes en el calendario',
        requirement: 100,
        category: 'dosificacion' as const,
        color: 'from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30',
        borderColor: 'border-orange-300 dark:border-orange-700',
        value: 'Organización Impecable: Gestiona tu tiempo y contenidos como un profesional'
    },
    {
        id: 'evaluador_estrella',
        title: '🏅 Evaluador Estrella',
        description: 'Genera 5 exámenes y 5 rúbricas o instrumentos de evaluación con IA',
        requirement: 10,
        category: 'evaluacion' as const,
        color: 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30',
        borderColor: 'border-blue-300 dark:border-blue-700',
        value: 'Evaluación Ágil y Precisa: Ahorra horas en la creación de instrumentos de calidad'
    },
    {
        id: 'monitor_asistencia',
        title: '📊 Monitor de Asistencia',
        description: 'Registra asistencia perfecta de tu grupo durante un mes completo',
        requirement: 30,
        category: 'asistencia' as const,
        color: 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30',
        borderColor: 'border-purple-300 dark:border-purple-700',
        value: 'Control Grupal Efectivo: Mantén el seguimiento completo de tu aula'
    },
    {
        id: 'enlace_familiar',
        title: '💬 Enlace Familiar',
        description: 'Genera 30 mensajes personalizados para padres de familia',
        requirement: 30,
        category: 'mensajes' as const,
        color: 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30',
        borderColor: 'border-green-300 dark:border-green-700',
        value: 'Vínculo Fuerte con Familias: Comunícate profesionalmente con cada padre'
    }
]

export function MuroLogros() {
    const { user } = useAuth()
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [loading, setLoading] = useState(true)
    const [totalProgress, setTotalProgress] = useState(0)

    useEffect(() => {
        if (user) {
            loadAchievements()
        }
    }, [user])

    const loadAchievements = async () => {
        if (!user) return

        try {
            // Obtener estadísticas del usuario
            const stats = await getUserStats(user.id)

            // Mapear logros con progreso actual
            const mappedAchievements: Achievement[] = achievementDefinitions.map(def => {
                const current = stats[def.category] || 0
                const unlocked = current >= def.requirement

                return {
                    id: def.id,
                    title: def.title,
                    description: def.description,
                    icon: def.title.split(' ')[0],
                    requirement: def.requirement,
                    current,
                    unlocked,
                    category: def.category,
                    color: def.color
                }
            })

            setAchievements(mappedAchievements)

            // Calcular progreso total
            const unlockedCount = mappedAchievements.filter(a => a.unlocked).length
            const progress = (unlockedCount / mappedAchievements.length) * 100
            setTotalProgress(progress)

        } catch (error) {
            console.error('Error loading achievements:', error)
        } finally {
            setLoading(false)
        }
    }

    const getUserStats = async (userId: string) => {
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

        // Dosificación: PDA vinculados (esto es un ejemplo, ajustar según tu esquema)
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

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'plan_analitico': return BookOpen
            case 'planeaciones': return Award
            case 'dosificacion': return BarChart3
            case 'evaluacion': return ClipboardCheck
            case 'asistencia': return Users
            case 'mensajes': return MessageCircle
            default: return Trophy
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                    <Trophy className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        Muro de Logros
                    </h1>
                    <Trophy className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Desbloquea medallas completando actividades. Cada logro te acerca a dominar todas las herramientas de EduPlanner.
                </p>
            </div>

            {/* Progreso General */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Tu Progreso General
                    </CardTitle>
                    <CardDescription>
                        Has desbloqueado {achievements.filter(a => a.unlocked).length} de {achievements.length} logros
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Progress value={totalProgress} className="h-3" />
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                            {totalProgress.toFixed(0)}% completado
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Grid de Logros */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement, index) => {
                    const def = achievementDefinitions[index]
                    const IconComponent = getCategoryIcon(achievement.category)
                    const progress = (achievement.current / achievement.requirement) * 100

                    return (
                        <Card
                            key={achievement.id}
                            className={`relative overflow-hidden transition-all ${achievement.unlocked
                                ? `bg-gradient-to-br ${def.color} ${def.borderColor} border-2 shadow-lg`
                                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {achievement.unlocked && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            )}

                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <div className={`p-3 rounded-lg ${achievement.unlocked
                                        ? 'bg-white/80 dark:bg-gray-800/80'
                                        : 'bg-gray-100 dark:bg-gray-800'
                                        }`}>
                                        {achievement.unlocked ? (
                                            <div className="text-3xl">{achievement.icon}</div>
                                        ) : (
                                            <Lock className="h-6 w-6 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className={`text-lg ${achievement.unlocked
                                            ? 'text-gray-900 dark:text-gray-100'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {achievement.title}
                                        </CardTitle>
                                        <CardDescription className={
                                            achievement.unlocked
                                                ? 'text-gray-700 dark:text-gray-300'
                                                : 'text-gray-500 dark:text-gray-500'
                                        }>
                                            {achievement.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {/* Progreso */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                                        <span className={`font-semibold ${achievement.unlocked
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {achievement.current} / {achievement.requirement}
                                        </span>
                                    </div>
                                    <Progress
                                        value={progress}
                                        className={`h-2 ${achievement.unlocked ? 'bg-white/50 dark:bg-gray-700/50' : ''}`}
                                    />
                                </div>

                                {/* Valor estratégico */}
                                <div className={`text-xs p-2 rounded-md ${achievement.unlocked
                                    ? 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'
                                    }`}>
                                    <strong>💡 {def.value.split(':')[0]}:</strong> {def.value.split(':')[1]}
                                </div>

                                {/* Estado */}
                                {achievement.unlocked ? (
                                    <Badge className="w-full justify-center bg-green-600 hover:bg-green-700 text-white">
                                        ✓ Desbloqueado
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="w-full justify-center">
                                        🔒 Bloqueado
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Footer motivacional */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="py-6">
                    <div className="text-center space-y-2">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            ¡Sigue así! 🚀
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Cada logro desbloqueado demuestra tu dominio de las herramientas que te ahorran horas de trabajo cada semana.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
