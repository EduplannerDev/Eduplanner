-- Migración: Dashboard Aggregation Layer
-- =====================================================
-- Description: Creates views and RPC functions for the platform dashboard
-- to improve performance and data aggregation.

-- 1. VIEW: Cumplimiento de Planeaciones
-- =====================================================
-- Calculates delivery metrics per plantel
CREATE OR REPLACE VIEW view_cumplimiento_planeaciones AS
WITH teachers_per_plantel AS (
    SELECT plantel_id, count(*) as total_profesores
    FROM user_plantel_assignments
    WHERE role = 'profesor' AND activo = true
    GROUP BY plantel_id
),
submissions_per_plantel AS (
    SELECT 
        plantel_id, 
        count(*) as total_entregadas,
        count(*) FILTER (WHERE estado = 'revisada') as total_revisadas,
        count(*) FILTER (WHERE estado = 'pendiente') as total_pendientes,
        count(DISTINCT profesor_id) as profesores_con_envios
    FROM planeaciones_enviadas
    GROUP BY plantel_id
)
SELECT 
    p.id as plantel_id,
    p.nombre as nombre_plantel,
    COALESCE(s.total_entregadas, 0) as total_entregadas,
    COALESCE(s.total_revisadas, 0) as total_revisadas,
    COALESCE(s.total_pendientes, 0) as total_pendientes,
    COALESCE(t.total_profesores, 0) as total_profesores_esperados,
    COALESCE(s.profesores_con_envios, 0) as profesores_cumplieron,
    CASE 
        WHEN COALESCE(t.total_profesores, 0) > 0 THEN 
            ROUND((COALESCE(s.profesores_con_envios, 0)::numeric / t.total_profesores::numeric) * 100, 2)
        ELSE 0 
    END as porcentaje_cumplimiento_profesores
FROM planteles p
LEFT JOIN submissions_per_plantel s ON p.id = s.plantel_id
LEFT JOIN teachers_per_plantel t ON p.id = t.plantel_id
WHERE p.activo = true;

COMMENT ON VIEW view_cumplimiento_planeaciones IS 'Vista agregada de cumplimiento de planeaciones por plantel';

-- 2. VIEW: Resumen de Seguridad (Incidencias)
-- =====================================================
-- Aggregates incidents by risk level per plantel
CREATE OR REPLACE VIEW view_resumen_seguridad AS
SELECT 
    plantel_id,
    count(*) as total_incidencias,
    count(*) FILTER (WHERE nivel_riesgo = 'bajo') as riesgo_bajo,
    count(*) FILTER (WHERE nivel_riesgo = 'alto') as riesgo_alto,
    count(*) FILTER (WHERE nivel_riesgo = 'critico') as riesgo_critico,
    count(*) FILTER (WHERE estado = 'cerrado') as casos_cerrados,
    count(*) FILTER (WHERE estado != 'cerrado') as casos_activos,
    MAX(created_at) as ultima_incidencia
FROM incidencias
GROUP BY plantel_id;

COMMENT ON VIEW view_resumen_seguridad IS 'Vista resumida de incidencias y niveles de riesgo por plantel';

-- 3. RPC: Promedio de Asistencia
-- =====================================================
-- Calculates daily attendance average for a plantel over a date range
CREATE OR REPLACE FUNCTION get_asistencia_promedio_plantel(
    p_plantel_id UUID,
    p_fecha_inicio DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
    p_fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    fecha DATE,
    total_alumnos BIGINT,
    presentes BIGINT,
    ausentes BIGINT,
    porcentaje_asistencia NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.fecha,
        count(*) as total_alumnos,
        count(*) FILTER (WHERE a.estado IN ('presente', 'retardo', 'justificado')) as presentes,
        count(*) FILTER (WHERE a.estado = 'ausente') as ausentes,
        ROUND(
            (count(*) FILTER (WHERE a.estado IN ('presente', 'retardo', 'justificado'))::numeric / count(*)::numeric) * 100, 
            2
        ) as porcentaje_asistencia
    FROM asistencia a
    JOIN grupos g ON a.grupo_id = g.id
    WHERE g.plantel_id = p_plantel_id
    AND a.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY a.fecha
    ORDER BY a.fecha ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_asistencia_promedio_plantel(UUID, DATE, DATE) IS 'Obtiene el promedio de asistencia diario para un plantel';

-- 4. RPC: Alertas de Riesgo (SiAT)
-- =====================================================
-- Identifies students at risk based on rules (Absences or Incidents)
CREATE OR REPLACE FUNCTION get_alertas_riesgo_siat(
    p_plantel_id UUID,
    p_limite_faltas INTEGER DEFAULT 3, -- Faltas en el ultimo mes para alerta
    p_min_riesgo_incidencia_level INTEGER DEFAULT 2 -- 1=bajo, 2=alto, 3=critico (placeholder logic)
)
RETURNS TABLE (
    alumno_id UUID,
    nombre_alumno TEXT,
    grupo TEXT,
    grado TEXT,
    total_faltas BIGINT,
    total_incidencias_graves BIGINT,
    nivel_riesgo_calculado TEXT, -- 'alto', 'medio'
    detalles JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH asistencia_recente AS (
        -- Faltas en los ultimos 30 dias
        SELECT 
            a.alumno_id,
            count(*) as faltas_mes
        FROM asistencia a
        JOIN grupos g ON a.grupo_id = g.id
        WHERE g.plantel_id = p_plantel_id
        AND a.estado = 'ausente'
        AND a.fecha >= (CURRENT_DATE - INTERVAL '30 days')
        GROUP BY a.alumno_id
    ),
    incidencias_graves AS (
        -- Incidencias 'alto' o 'critico' historicas (o recientes?)
        SELECT 
            i.alumno_id,
            count(*) as num_incidencias
        FROM incidencias i
        WHERE i.plantel_id = p_plantel_id
        AND i.nivel_riesgo IN ('alto', 'critico')
        GROUP BY i.alumno_id
    )
    SELECT 
        al.id as alumno_id,
        al.nombre_completo as nombre_alumno, -- Asumiendo que alumnos tiene nombre_completo, ajustar si es diferente
        g.grupo,
        g.grado,
        COALESCE(ar.faltas_mes, 0) as total_faltas,
        COALESCE(ig.num_incidencias, 0) as total_incidencias_graves,
        CASE 
            WHEN COALESCE(ig.num_incidencias, 0) > 0 THEN 'critico'
            WHEN COALESCE(ar.faltas_mes, 0) >= p_limite_faltas THEN 'alto'
            ELSE 'medio' -- No deberia salir si filtramos abajo, pero por seguridad
        END as nivel_riesgo_calculado,
        jsonb_build_object(
            'faltas_30_dias', COALESCE(ar.faltas_mes, 0),
            'incidencias_graves', COALESCE(ig.num_incidencias, 0)
        ) as detalles
    FROM alumnos al
    JOIN grupos g ON al.grupo_id = g.id
    LEFT JOIN asistencia_recente ar ON al.id = ar.alumno_id
    LEFT JOIN incidencias_graves ig ON al.id = ig.alumno_id
    WHERE g.plantel_id = p_plantel_id
    AND (COALESCE(ar.faltas_mes, 0) >= p_limite_faltas OR COALESCE(ig.num_incidencias, 0) > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_alertas_riesgo_siat(UUID, INTEGER, INTEGER) IS 'Detecta alumnos en riesgo (SiAT) basado en faltas recientes e incidencias graves';
