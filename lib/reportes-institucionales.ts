import { createClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, formatISO } from 'date-fns'

export interface ReporteInstitucionalData {
    periodo: {
        mes: string
        anio: number
        inicio: string
        fin: string
    }
    kpis: {
        asistencia: {
            promedio: number
            total_registros: number
            trend: 'up' | 'down' | 'neutral'
        }
        planeaciones: {
            total: number
            completadas: number
            progreso_porcentaje: number
        }
        incidencias: {
            total: number
            resueltas: number
            pendientes: number
            resolucion_porcentaje: number
        }
    }
    detalles: {
        grupos_asistencia: { grupo: string; porcentaje: number }[]
        incidencias_tipo: { tipo: string; cantidad: number }[]
    }
}

export async function getReportePorRango(plantelId: string, fechaInicio: Date, fechaFin: Date, tituloPeriodo: string): Promise<ReporteInstitucionalData> {
    console.log('🔍 getReportePorRango called with:', {
        plantelId,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        tituloPeriodo
    });

    // Use Service Role client to bypass RLS (authorization checked in API route)
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
    const startStr = formatISO(fechaInicio)
    const endStr = formatISO(fechaFin)

    // 2. Obtener grupos del plantel (columna plantel_id existe y está poblada)
    const { data: grupos } = await supabase
        .from('grupos')
        .select('id, nombre, grado')
        .eq('plantel_id', plantelId)

    console.log('📦 Grupos found:', grupos?.length || 0)

    const gruposIds = grupos?.map(g => g.id) || []

    // 3. Asistencia Global (Filtrar por grupos del plantel)
    let asistenciaPromedio = 0
    let totalAsistencia = 0
    const asistenciaPorGrupo: Record<string, { present: number; total: number }> = {}

    // CRITICAL: Only query if we have grupos, otherwise skip
    if (gruposIds.length > 0) {
        const { data: asistencia } = await supabase
            .from('asistencia')
            .select('estado, grupo_id')
            .in('grupo_id', gruposIds)
            .gte('fecha', startStr)
            .lte('fecha', endStr)

        if (asistencia && asistencia.length > 0) {
            totalAsistencia = asistencia.length
            const presentes = asistencia.filter(a => a.estado === 'presente' || a.estado === 'retardo').length
            asistenciaPromedio = Math.round((presentes / totalAsistencia) * 100)

            asistencia.forEach(a => {
                const gId = a.grupo_id
                if (!asistenciaPorGrupo[gId]) asistenciaPorGrupo[gId] = { present: 0, total: 0 }
                asistenciaPorGrupo[gId].total++
                if (a.estado === 'presente' || a.estado === 'retardo') asistenciaPorGrupo[gId].present++
            })
        }
        console.log('📊 Asistencia:', { totalAsistencia, asistenciaPromedio });
    } else {
        console.log('⚠️ No grupos found, skipping asistencia query');
    }

    // Mapear detalles grupos
    const detallesGrupos = grupos?.map(g => ({
        grupo: `${g.grado}° ${g.nombre}`,
        porcentaje: asistenciaPorGrupo[g.id] && asistenciaPorGrupo[g.id].total > 0
            ? Math.round((asistenciaPorGrupo[g.id].present / asistenciaPorGrupo[g.id].total) * 100)
            : 0
    })).sort((a, b) => b.porcentaje - a.porcentaje) || []

    // 4. Planeaciones (Buscar profesores en profiles Y assignments)
    // Profiles tiene plantel_id directo
    const { data: perfilesProfs } = await supabase
        .from('profiles')
        .select('id')
        .eq('plantel_id', plantelId)
        .eq('role', 'profesor')

    const profileIds = perfilesProfs?.map(p => p.id) || []

    // Assignments (relaciones múltiples)
    const { data: asignaciones } = await supabase
        .from('user_plantel_assignments')
        .select('user_id')
        .eq('plantel_id', plantelId)
        .eq('role', 'profesor')
        .eq('activo', true)

    const assignedIds = asignaciones?.map(a => a.user_id) || []

    // Merge unique
    const profesorIds = [...new Set([...profileIds, ...assignedIds])]

    console.log('👥 Professors found:', {
        fromProfiles: profileIds.length,
        fromAssignments: assignedIds.length,
        total: profesorIds.length
    });

    let totalPlaneaciones = 0
    let completadas = 0
    let progresoPlaneaciones = 0

    // CRITICAL: Only query if we have professors, otherwise skip
    if (profesorIds.length > 0) {
        const { data: planeaciones } = await supabase
            .from('planeaciones')
            .select('id, estado, created_at')
            .in('user_id', profesorIds)
            .gte('created_at', startStr)
            .lte('created_at', endStr)

        totalPlaneaciones = planeaciones?.length || 0
        completadas = planeaciones?.filter(p => p.estado === 'completada' || p.estado === 'terminada' || p.estado === 'publicada').length || 0
        progresoPlaneaciones = totalPlaneaciones > 0 ? Math.round((completadas / totalPlaneaciones) * 100) : 0

        console.log('📝 Planeaciones:', { totalPlaneaciones, completadas, progresoPlaneaciones });
    } else {
        console.log('⚠️ No professors found, skipping planeaciones query');
    }


    // 5. Incidencias (directo por plantel_id)
    const { data: incidencias } = await supabase
        .from('incidencias')
        .select('id, estado, tipo, created_at')
        .eq('plantel_id', plantelId)
        .gte('created_at', startStr)
        .lte('created_at', endStr)

    const totalIncidencias = incidencias?.length || 0
    const resueltas = incidencias?.filter(i => i.estado === 'cerrado').length || 0
    const pendientes = totalIncidencias - resueltas
    const resolucionPorcentaje = totalIncidencias > 0 ? Math.round((resueltas / totalIncidencias) * 100) : 100

    // Agrupar por tipo
    const incidenciasPorTipo: Record<string, number> = {}
    incidencias?.forEach(i => {
        incidenciasPorTipo[i.tipo] = (incidenciasPorTipo[i.tipo] || 0) + 1
    })

    const detallesIncidencias = Object.entries(incidenciasPorTipo).map(([tipo, cantidad]) => ({
        tipo: tipo.replace(/_/g, ' '),
        cantidad
    })).sort((a, b) => b.cantidad - a.cantidad)

    return {
        periodo: {
            mes: tituloPeriodo,
            anio: fechaInicio.getFullYear(),
            inicio: fechaInicio.toLocaleDateString('es-MX'),
            fin: fechaFin.toLocaleDateString('es-MX')
        },
        kpis: {
            asistencia: {
                promedio: asistenciaPromedio,
                total_registros: totalAsistencia,
                trend: asistenciaPromedio >= 90 ? 'up' : asistenciaPromedio >= 80 ? 'neutral' : 'down'
            },
            planeaciones: {
                total: totalPlaneaciones,
                completadas: completadas,
                progreso_porcentaje: progresoPlaneaciones
            },
            incidencias: {
                total: totalIncidencias,
                resueltas: resueltas,
                pendientes: pendientes,
                resolucion_porcentaje: resolucionPorcentaje
            }
        },
        detalles: {
            grupos_asistencia: detallesGrupos,
            incidencias_tipo: detallesIncidencias
        }
    }
}
