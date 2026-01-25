import { createClient } from '@/lib/supabase'
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
    const supabase = createClient()
    const startStr = formatISO(fechaInicio)
    const endStr = formatISO(fechaFin)

    // 1. Asistencia Global
    const { data: asistenciaData } = await supabase
        .from('asistencia')
        .select('estado, alumno:alumnos!inner(grupo_id)') // Join explicito si necesario, o filtrar por alumnos del plantel
        .gte('fecha', startStr)
        .lte('fecha', endStr)
    // Nota: Idealmente filtras por plantel. Si asistencia tiene plantel_id directo mejor, si no via alumnos->grupo->plantel
    // Asumiendo que podemos filtrar por los grupos del plantel primero

    // Optimización: Primero obtener grupos del plantel
    const { data: grupos } = await supabase
        .from('grupos')
        .select('id, nombre, grado')
        .eq('plantel_id', plantelId)

    const gruposIds = grupos?.map(g => g.id) || []

    // Re-query asistencia filtrada
    const { data: asistencia } = await supabase
        .from('asistencia')
        .select(`
      estado,
      alumno_id,
      alumnos!inner(grupo_id)
    `)
        .in('alumnos.grupo_id', gruposIds)
        .gte('fecha', startStr)
        .lte('fecha', endStr)

    let asistenciaPromedio = 0
    let totalAsistencia = 0
    const asistenciaPorGrupo: Record<string, { present: number; total: number }> = {}

    if (asistencia && asistencia.length > 0) {
        totalAsistencia = asistencia.length
        const presentes = asistencia.filter(a => a.estado === 'presente' || a.estado === 'retardo').length
        asistenciaPromedio = Math.round((presentes / totalAsistencia) * 100)

        // Agrupar por grupo
        asistencia.forEach(a => {
            // @ts-ignore
            const gId = a.alumnos?.grupo_id
            if (!asistenciaPorGrupo[gId]) asistenciaPorGrupo[gId] = { present: 0, total: 0 }
            asistenciaPorGrupo[gId].total++
            if (a.estado === 'presente' || a.estado === 'retardo') asistenciaPorGrupo[gId].present++
        })
    }

    // Mapear detalles grupos
    const detallesGrupos = grupos?.map(g => ({
        grupo: `${g.grado}° ${g.nombre}`,
        porcentaje: asistenciaPorGrupo[g.id]
            ? Math.round((asistenciaPorGrupo[g.id].present / asistenciaPorGrupo[g.id].total) * 100)
            : 0
    })).sort((a, b) => b.porcentaje - a.porcentaje) || []


    // 2. Planeaciones (Productividad Docente)
    // Contamos planeaciones creadas o actualizadas en este mes? O activas?
    // Generalmente interesa cuantas se completaron en el mes.
    const { data: planeaciones } = await supabase
        .from('planeaciones')
        .select('id, estado, created_at')
        .eq('plantel_id', plantelId) // Si planeaciones tiene plantel_id directo
        .gte('created_at', startStr)
        .lte('created_at', endStr)

    const totalPlaneaciones = planeaciones?.length || 0
    const completadas = planeaciones?.filter(p => p.estado === 'terminada' || p.estado === 'publicada').length || 0 // Ajustar estados reales
    const progresoPlaneaciones = totalPlaneaciones > 0 ? Math.round((completadas / totalPlaneaciones) * 100) : 0


    // 3. Incidencias (Seguridad)
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
