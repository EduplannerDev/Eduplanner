import { createClient } from '@/lib/supabase';
import { getAlumnosConAsistencia, getEstadisticasAsistencia } from './asistencia';

export interface AlumnoRiesgo {
    id: string;
    nombre: string;
    grupo: string;
    grado: string;
    nivel: string;
    foto_url?: string;

    // Métricas
    promedio: number;
    asistencia: number; // Porcentaje 0-100
    incidencias: number;

    // Riesgo
    nivelRiesgo: 'alto' | 'medio' | 'bajo';
    factores: string[]; // Lista de razones (ej: "Baja Asistencia", "Reprobación")
}

export interface EstadisticasRiesgo {
    totalAlumnos: number;
    altoRiesgo: number;
    medioRiesgo: number;
    bajoRiesgo: number;
    alumnos: AlumnoRiesgo[];
}

/**
 * Obtiene el análisis de riesgo de deserción para todos los alumnos de un plantel
 */
export async function getRiesgoDesercion(plantelId: string): Promise<EstadisticasRiesgo> {
    const supabase = createClient();

    try {
        // 1. Obtener todos los grupos del plantel
        const { data: grupos, error: gruposError } = await supabase
            .from('grupos')
            .select('id, nombre, grado, nivel')
            .eq('plantel_id', plantelId);

        if (gruposError) throw gruposError;
        if (!grupos || grupos.length === 0) return createEmptyStats();

        const gruposIds = grupos.map(g => g.id);
        const gruposMap = new Map(grupos.map(g => [g.id, g]));

        // 2. Obtener todos los alumnos de esos grupos
        const { data: alumnos, error: alumnosError } = await supabase
            .from('alumnos')
            .select('id, nombre_completo, grupo_id, foto_url')
            .in('grupo_id', gruposIds);

        if (alumnosError) throw alumnosError;
        if (!alumnos || alumnos.length === 0) return createEmptyStats();

        const alumnosIds = alumnos.map(a => a.id);

        // 3. Obtener Calificaciones (Promedios)
        // Optimizacion: Traer todas las calificaciones y calcular promedio en memoria
        const { data: calificaciones, error: califError } = await supabase
            .from('calificaciones')
            .select('alumno_id, calificacion')
            .in('alumno_id', alumnosIds);

        if (califError) console.error('Error fetching calificaciones risk:', califError);

        // Agrupar calificaciones por alumno
        const calificacionesMap = new Map<string, number[]>();
        calificaciones?.forEach(c => {
            if (c.calificacion !== null) {
                const califs = calificacionesMap.get(c.alumno_id) || [];
                califs.push(c.calificacion);
                calificacionesMap.set(c.alumno_id, califs);
            }
        });

        // 4. Obtener Asistencia
        // Esto es pesado, idealmente debería haber una vista materializada o cache
        // Por ahora traeremos los conteos crudos de la tabla asistencia
        const { data: asistencia, error: asistError } = await supabase
            .from('asistencia')
            .select('alumno_id, estado')
            .in('alumno_id', alumnosIds);

        if (asistError) console.error('Error fetching asistencia risk:', asistError);

        const asistenciaMap = new Map<string, { total: number, presentes: number }>();
        asistencia?.forEach(r => {
            const stats = asistenciaMap.get(r.alumno_id) || { total: 0, presentes: 0 };
            stats.total++;
            if (r.estado === 'presente' || r.estado === 'retardo') {
                stats.presentes++;
            }
            asistenciaMap.set(r.alumno_id, stats);
        });

        // 5. Obtener Incidencias (Seguimiento Diario tipo 'comportamiento')
        const { data: incidencias, error: incidenciasError } = await supabase
            .from('seguimiento_diario')
            .select('alumno_id')
            .eq('tipo', 'comportamiento') // Solo nos importan las de comportamiento para riesgo
            .in('alumno_id', alumnosIds);

        if (incidenciasError) console.error('Error fetching incidencias risk:', incidenciasError);

        const incidenciasMap = new Map<string, number>();
        incidencias?.forEach(i => {
            const count = incidenciasMap.get(i.alumno_id) || 0;
            incidenciasMap.set(i.alumno_id, count + 1);
        });

        // 6. Procesar y Calcular Riesgo
        const alumnosRiesgo: AlumnoRiesgo[] = alumnos.map(alumno => {
            const grupo = gruposMap.get(alumno.grupo_id);

            // Calcular Promedio
            const califs = calificacionesMap.get(alumno.id) || [];
            const promedio = califs.length > 0
                ? parseFloat((califs.reduce((a, b) => a + b, 0) / califs.length).toFixed(1))
                : 0; // Si no tiene calificaciones, asumimos 0 para alertar (o podria ser neutro) -> Mejor 0 si ya hay actividades, pero si es inicio de ciclo? Hagamos que 0 cuente como riesgo si hay actividades globales. 
            // Ajuste: Si no tiene calificaciones, no lo penalicemos tanto aun, pongamos null o manejemoslo. 
            // Para simplificar: Promedio 0 es riesgo alto.

            // Calcular Asistencia
            const asistStats = asistenciaMap.get(alumno.id);
            const asistenciaPct = asistStats && asistStats.total > 0
                ? Math.round((asistStats.presentes / asistStats.total) * 100)
                : 100; // Si no hay registros, asumimos asistencia perfecta (inicio de ciclo)

            // Calcular Incidencias
            const numIncidencias = incidenciasMap.get(alumno.id) || 0;

            // Determinar Nivel de Riesgo
            let nivelRiesgo: 'alto' | 'medio' | 'bajo' = 'bajo';
            const factores: string[] = [];

            // Criterios de Riesgo
            // ALTO
            if (asistenciaPct < 80) {
                nivelRiesgo = 'alto';
                factores.push('Baja Asistencia Crítica');
            }
            if (promedio > 0 && promedio < 6.0) { // Solo si tiene promedio registrado
                nivelRiesgo = 'alto';
                factores.push('Reprobación Académica');
            }
            if (numIncidencias > 3) {
                nivelRiesgo = 'alto';
                factores.push('Múltiples Incidencias');
            }

            // MEDIO (Solo si no es alto)
            if (nivelRiesgo !== 'alto') {
                if (asistenciaPct >= 80 && asistenciaPct < 90) {
                    nivelRiesgo = 'medio';
                    factores.push('Asistencia Irregular');
                }
                if (promedio >= 6.0 && promedio < 7.5) {
                    nivelRiesgo = 'medio';
                    factores.push('Bajo Rendimiento');
                }
                if (numIncidencias >= 1 && numIncidencias <= 3) {
                    nivelRiesgo = 'medio';
                    factores.push('Incidentes de Conducta');
                }
            }

            return {
                id: alumno.id,
                nombre: alumno.nombre_completo,
                grupo: grupo?.nombre || 'Sin Grupo',
                grado: grupo?.grado || '',
                nivel: grupo?.nivel || '',
                foto_url: alumno.foto_url,
                promedio,
                asistencia: asistenciaPct,
                incidencias: numIncidencias,
                nivelRiesgo,
                factores
            };
        });

        // Ordenar: Alto riesgo primero, luego por promedio ascendente
        alumnosRiesgo.sort((a, b) => {
            const riskScore = { alto: 3, medio: 2, bajo: 1 };
            if (riskScore[a.nivelRiesgo] !== riskScore[b.nivelRiesgo]) {
                return riskScore[b.nivelRiesgo] - riskScore[a.nivelRiesgo];
            }
            return a.promedio - b.promedio;
        });

        // Estadísticas Globales
        const altoRiesgo = alumnosRiesgo.filter(a => a.nivelRiesgo === 'alto').length;
        const medioRiesgo = alumnosRiesgo.filter(a => a.nivelRiesgo === 'medio').length;
        const bajoRiesgo = alumnosRiesgo.filter(a => a.nivelRiesgo === 'bajo').length;

        return {
            totalAlumnos: alumnos.length,
            altoRiesgo,
            medioRiesgo,
            bajoRiesgo,
            alumnos: alumnosRiesgo
        };

    } catch (error) {
        console.error('Error calculando riesgo de deserción:', error);
        return createEmptyStats();
    }
}

function createEmptyStats(): EstadisticasRiesgo {
    return {
        totalAlumnos: 0,
        altoRiesgo: 0,
        medioRiesgo: 0,
        bajoRiesgo: 0,
        alumnos: []
    };
}
