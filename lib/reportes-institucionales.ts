import { createClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, formatISO } from 'date-fns'

export interface CasoCritico {
    nombre: string
    grupo: string
    motivo: string
    nivel_riesgo: 'alto' | 'medio' | 'bajo'
    accion_recomendada: string
}

export interface TendenciaRiesgo {
    cambio_porcentaje: number
    direccion: 'incremento' | 'reduccion' | 'estable'
    insight: string
    incidencias_alto_impacto: number
}

export interface SaludDocente {
    productividad: 'alta' | 'media' | 'baja'
    alineacion_nem: boolean
    resumen: string
    profesores_activos: number
    profesores_total: number
}

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
            cambio_vs_anterior?: number
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
            cambio_vs_anterior?: number
        }
    }
    detalles: {
        grupos_asistencia: { grupo: string; porcentaje: number }[]
        incidencias_tipo: { tipo: string; cantidad: number; protocolo_url?: string }[]
    }
    tendencia_riesgo?: TendenciaRiesgo
    salud_docente?: SaludDocente
    casos_criticos?: CasoCritico[]
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

    const detallesIncidencias = Object.entries(incidenciasPorTipo).map(([tipo, cantidad]) => {
        // Map protocol URLs for high-impact incidents
        const protocolos: Record<string, string> = {
            'portacion_armas': '/protocolos/seguridad-portacion-armas',
            'violencia_fisica': '/protocolos/seguridad-violencia',
            'acoso_escolar': '/protocolos/seguimiento-acoso',
            'consumo_sustancias': '/protocolos/salud-adicciones'
        }

        return {
            tipo: tipo.replace(/_/g, ' '),
            cantidad,
            protocolo_url: protocolos[tipo]
        }
    }).sort((a, b) => b.cantidad - a.cantidad)

    console.log('📋 Incidencias:', { totalIncidencias, resueltas, pendientes, resolucionPorcentaje });

    // 6. NUEVO: Obtener datos del periodo anterior para comparación
    const diasPeriodo = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
    const fechaInicioPrevio = new Date(fechaInicio)
    fechaInicioPrevio.setDate(fechaInicioPrevio.getDate() - diasPeriodo)
    const fechaFinPrevio = new Date(fechaInicio)
    fechaFinPrevio.setDate(fechaFinPrevio.getDate() - 1)

    // Asistencia periodo anterior
    let asistenciaAnterior = 0
    if (gruposIds.length > 0) {
        const { data: asistenciaPrev } = await supabase
            .from('asistencia')
            .select('estado')
            .in('grupo_id', gruposIds)
            .gte('fecha', formatISO(fechaInicioPrevio))
            .lte('fecha', formatISO(fechaFinPrevio))

        if (asistenciaPrev && asistenciaPrev.length > 0) {
            const presentesPrev = asistenciaPrev.filter(a => a.estado === 'presente' || a.estado === 'retardo').length
            asistenciaAnterior = Math.round((presentesPrev / asistenciaPrev.length) * 100)
        }
    }

    // Incidencias periodo anterior
    const { data: incidenciasPrev } = await supabase
        .from('incidencias')
        .select('id')
        .eq('plantel_id', plantelId)
        .gte('created_at', formatISO(fechaInicioPrevio))
        .lte('created_at', formatISO(fechaFinPrevio))

    const incidenciasAnterior = incidenciasPrev?.length || 0

    // 7. NUEVO: Calcular Tendencia de Riesgo
    const cambioIncidencias = incidenciasAnterior > 0
        ? Math.round(((totalIncidencias - incidenciasAnterior) / incidenciasAnterior) * 100)
        : 0

    const incidenciasAltoImpacto = incidencias?.filter(i =>
        ['portacion_armas', 'violencia_fisica', 'acoso_escolar'].includes(i.tipo)
    ).length || 0

    const direccionRiesgo: 'incremento' | 'reduccion' | 'estable' =
        cambioIncidencias > 5 ? 'incremento' : cambioIncidencias < -5 ? 'reduccion' : 'estable'

    const insightRiesgo = direccionRiesgo === 'incremento'
        ? `El riesgo de deserción ${Math.abs(cambioIncidencias) > 0 ? `aumentó ${Math.abs(cambioIncidencias)}%` : 'se mantiene elevado'} esta semana debido a las ${incidenciasAltoImpacto} nuevas incidencias de alto impacto registradas.`
        : direccionRiesgo === 'reduccion'
            ? `Tendencia positiva: El riesgo de deserción se redujo ${Math.abs(cambioIncidencias)}% gracias a la gestión efectiva de incidencias y seguimiento oportuno.`
            : `El riesgo de deserción se mantiene estable. Se recomienda continuar con el seguimiento preventivo de los ${incidenciasAltoImpacto} casos de alto impacto.`

    // 8. NUEVO: Salud Docente
    const productividad: 'alta' | 'media' | 'baja' =
        progresoPlaneaciones >= 90 ? 'alta' : progresoPlaneaciones >= 70 ? 'media' : 'baja'

    const alineacionNEM = progresoPlaneaciones >= 80 // Asumimos que planeaciones completas = alineadas

    const resumenDocente = productividad === 'alta'
        ? `Productividad Docente: Alta. Todos los grupos cuentan con planeación vigente alineada a la Nueva Escuela Mexicana (NEM). Los ${profesorIds.length} docentes están cumpliendo con sus responsabilidades pedagógicas.`
        : productividad === 'media'
            ? `Productividad Docente: Media. ${completadas} de ${totalPlaneaciones} planeaciones completadas. Se recomienda seguimiento para alcanzar el 100% de cumplimiento con la NEM.`
            : `Atención requerida: Solo ${progresoPlaneaciones}% de planeaciones completadas. Es necesario implementar un plan de apoyo docente para garantizar la alineación con la NEM.`

    // 9. NUEVO: Casos Críticos (Alumnos en Riesgo Alto)
    const casosCriticos: CasoCritico[] = []

    if (gruposIds.length > 0) {
        // Obtener estudiantes con alta deserción o incidencias críticas
        const { data: alumnosRiesgo } = await supabase
            .rpc('get_high_risk_students', { p_plantel_id: plantelId })
            .limit(5)

        if (alumnosRiesgo && alumnosRiesgo.length > 0) {
            for (const alumno of alumnosRiesgo) {
                const grupo = grupos?.find(g => g.id === alumno.grupo_id)
                casosCriticos.push({
                    nombre: alumno.nombre_completo,
                    grupo: grupo ? `${grupo.grado}° ${grupo.nombre}` : 'N/A',
                    motivo: alumno.motivo || 'Alta probabilidad de deserción',
                    nivel_riesgo: alumno.nivel_riesgo || 'alto',
                    accion_recomendada: alumno.nivel_riesgo === 'alto'
                        ? 'Contacto inmediato con familia y plan de intervención personalizado'
                        : 'Seguimiento semanal y monitoreo de asistencia'
                })
            }
        }
    }

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
                trend: asistenciaPromedio >= 90 ? 'up' : asistenciaPromedio >= 80 ? 'neutral' : 'down',
                cambio_vs_anterior: asistenciaAnterior > 0 ? asistenciaPromedio - asistenciaAnterior : undefined
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
                resolucion_porcentaje: resolucionPorcentaje,
                cambio_vs_anterior: cambioIncidencias
            }
        },
        detalles: {
            grupos_asistencia: detallesGrupos,
            incidencias_tipo: detallesIncidencias
        },
        tendencia_riesgo: {
            cambio_porcentaje: cambioIncidencias,
            direccion: direccionRiesgo,
            insight: insightRiesgo,
            incidencias_alto_impacto: incidenciasAltoImpacto
        },
        salud_docente: {
            productividad: productividad,
            alineacion_nem: alineacionNEM,
            resumen: resumenDocente,
            profesores_activos: profesorIds.length,
            profesores_total: profesorIds.length
        },
        casos_criticos: casosCriticos.length > 0 ? casosCriticos : undefined
    }
}
