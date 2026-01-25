import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const plantelId = searchParams.get('plantelId')

    if (!plantelId) {
        return NextResponse.json({ error: 'plantelId is required' }, { status: 400 })
    }

    try {
        // Use service role client for analytics
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Get grupos
        const { data: grupos } = await supabase
            .from('grupos')
            .select('id, nombre, grado, grupo')
            .eq('plantel_id', plantelId)
            .eq('activo', true)

        if (!grupos || grupos.length === 0) {
            return NextResponse.json({
                promedio: 0,
                tendencia: 'neutral',
                estudiantesEnRiesgo: 0,
                totalEstudiantes: 0,
                grupoMejor: null,
                grupoPeor: null
            })
        }

        const grupoIds = grupos.map(g => g.id)

        // Get actividades
        const { data: actividades } = await supabase
            .from('actividades_evaluables')
            .select('id, grupo_id')
            .in('grupo_id', grupoIds)
            .is('deleted_at', null)

        if (!actividades || actividades.length === 0) {
            return NextResponse.json({
                promedio: 0,
                tendencia: 'neutral',
                estudiantesEnRiesgo: 0,
                totalEstudiantes: 0,
                grupoMejor: null,
                grupoPeor: null
            })
        }

        const actividadIds = actividades.map(a => a.id)

        // Get calificaciones
        const { data: calificaciones } = await supabase
            .from('calificaciones')
            .select('calificacion, alumno_id, actividad_id')
            .in('actividad_id', actividadIds)
            .not('calificacion', 'is', null)

        if (!calificaciones || calificaciones.length === 0) {
            return NextResponse.json({
                promedio: 0,
                tendencia: 'neutral',
                estudiantesEnRiesgo: 0,
                totalEstudiantes: 0,
                grupoMejor: null,
                grupoPeor: null
            })
        }

        // Calculate average
        const totalCalificaciones = calificaciones.reduce((sum, c) => sum + (c.calificacion || 0), 0)
        const promedio = Math.round((totalCalificaciones / calificaciones.length) * 10) / 10

        // Calculate unique students and at-risk
        const estudiantesUnicos = new Set(calificaciones.map(c => c.alumno_id))
        const totalEstudiantes = estudiantesUnicos.size

        // Calculate averages per student
        const promediosPorAlumno = new Map<string, number[]>()
        calificaciones.forEach(c => {
            const current = promediosPorAlumno.get(c.alumno_id) || []
            promediosPorAlumno.set(c.alumno_id, [...current, c.calificacion!])
        })

        let estudiantesEnRiesgo = 0
        promediosPorAlumno.forEach(califs => {
            const promAlumno = califs.reduce((a, b) => a + b, 0) / califs.length
            if (promAlumno < 6) estudiantesEnRiesgo++
        })

        // Calculate average per group
        const promediosPorGrupo = new Map<string, number[]>()

        for (const calif of calificaciones) {
            const actividad = actividades.find(a => a.id === calif.actividad_id)
            if (!actividad) continue

            const current = promediosPorGrupo.get(actividad.grupo_id) || []
            promediosPorGrupo.set(actividad.grupo_id, [...current, calif.calificacion!])
        }

        const gruposConPromedio = Array.from(promediosPorGrupo.entries()).map(([grupoId, califs]) => {
            const grupo = grupos.find(g => g.id === grupoId)!
            const promGrupo = califs.reduce((a, b) => a + b, 0) / califs.length
            return {
                nombre: `${grupo.grado}° ${grupo.nombre}`,
                promedio: Math.round(promGrupo * 10) / 10
            }
        })

        gruposConPromedio.sort((a, b) => b.promedio - a.promedio)

        const grupoMejor = gruposConPromedio[0] || null
        const grupoPeor = gruposConPromedio[gruposConPromedio.length - 1] || null

        return NextResponse.json({
            promedio,
            tendencia: 'neutral' as const,
            estudiantesEnRiesgo,
            totalEstudiantes,
            grupoMejor,
            grupoPeor
        })
    } catch (error) {
        console.error('Error getting promedio general:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
