-- Migración: Dashboard Optimization and Security
-- =====================================================
-- Description: Adds optimal indices and secures Views/RPCs for the dashboard.
-- Depends on: 20251229000000_dashboard_aggregation.sql

-- 1. OPTIMIZED INDICES
-- =====================================================
-- Asistencia: Used in get_asistencia_promedio_plantel (filtered by fecha, aggregated by estado)
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha_estado ON asistencia(fecha, estado);

-- Incidencias: Used in view_resumen_seguridad (grouped by plantel_id, filtered by nivel_riesgo)
CREATE INDEX IF NOT EXISTS idx_incidencias_plantel_riesgo ON incidencias(plantel_id, nivel_riesgo);

-- Planeaciones Enviadas: Used in view_cumplimiento_planeaciones (grouped by plantel_id, filtered by estado)
CREATE INDEX IF NOT EXISTS idx_planeaciones_enviadas_plantel_estado ON planeaciones_enviadas(plantel_id, estado);


-- 2. SECURE RPC FUNCTIONS
-- =====================================================
-- The previous RPCs were SECURITY DEFINER (running as admin). 
-- We must explicitly verify that the requesting user (auth.uid()) belongs to the requested plantel.

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
    -- Security Check: Verify user has access to this plantel
    IF NOT EXISTS (
        SELECT 1 FROM user_plantel_assignments
        WHERE user_id = auth.uid() 
        AND plantel_id = p_plantel_id 
        AND activo = true
        UNION
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'administrador'
    ) THEN
        RAISE EXCEPTION 'Access denied: User does not belong to the specified plantel';
    END IF;

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


CREATE OR REPLACE FUNCTION get_alertas_riesgo_siat(
    p_plantel_id UUID,
    p_limite_faltas INTEGER DEFAULT 3,
    p_min_riesgo_incidencia_level INTEGER DEFAULT 2
)
RETURNS TABLE (
    alumno_id UUID,
    nombre_alumno TEXT,
    grupo TEXT,
    grado TEXT,
    total_faltas BIGINT,
    total_incidencias_graves BIGINT,
    nivel_riesgo_calculado TEXT,
    detalles JSONB
) AS $$
BEGIN
    -- Security Check: Verify user has access to this plantel
    IF NOT EXISTS (
        SELECT 1 FROM user_plantel_assignments
        WHERE user_id = auth.uid() 
        AND plantel_id = p_plantel_id 
        AND activo = true
        UNION
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'administrador'
    ) THEN
        RAISE EXCEPTION 'Access denied: User does not belong to the specified plantel';
    END IF;

    RETURN QUERY
    WITH asistencia_recente AS (
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
        al.nombre_completo as nombre_alumno,
        g.grupo,
        g.grado,
        COALESCE(ar.faltas_mes, 0) as total_faltas,
        COALESCE(ig.num_incidencias, 0) as total_incidencias_graves,
        CASE 
            WHEN COALESCE(ig.num_incidencias, 0) > 0 THEN 'critico'
            WHEN COALESCE(ar.faltas_mes, 0) >= p_limite_faltas THEN 'alto'
            ELSE 'medio'
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


-- 3. SECURE VIEWS 
-- =====================================================
-- We recreate the views to ensure they check permissions or rely on strict RLS.
-- Since views are SECURITY INVOKER by default, they will use the user's RLS.
-- However, an explicit check for the user's plantel membership is safer for the query structure.

-- Redefine view_cumplimiento_planeaciones
DROP VIEW IF EXISTS view_cumplimiento_planeaciones;
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
WHERE p.activo = true
-- EXPLICIT SECURITY FILTER: Only show rows for planteles the user is assigned to (as Director) or Admin
AND (
    EXISTS (
        SELECT 1 FROM user_plantel_assignments upa
        WHERE upa.user_id = auth.uid() 
        AND upa.plantel_id = p.id
        AND upa.role = 'director'
        AND upa.activo = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'administrador'
    )
);


-- Redefine view_resumen_seguridad
DROP VIEW IF EXISTS view_resumen_seguridad;
CREATE OR REPLACE VIEW view_resumen_seguridad AS
SELECT 
    i.plantel_id,
    count(*) as total_incidencias,
    count(*) FILTER (WHERE i.nivel_riesgo = 'bajo') as riesgo_bajo,
    count(*) FILTER (WHERE i.nivel_riesgo = 'alto') as riesgo_alto,
    count(*) FILTER (WHERE i.nivel_riesgo = 'critico') as riesgo_critico,
    count(*) FILTER (WHERE i.estado = 'cerrado') as casos_cerrados,
    count(*) FILTER (WHERE i.estado != 'cerrado') as casos_activos,
    MAX(i.created_at) as ultima_incidencia
FROM incidencias i
-- EXPLICIT SECURITY FILTER: Ensure the aggregation only includes planteles we have access to
WHERE (
    EXISTS (
        SELECT 1 FROM user_plantel_assignments upa
        WHERE upa.user_id = auth.uid() 
        AND upa.plantel_id = i.plantel_id
        AND upa.role = 'director'
        AND upa.activo = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'administrador'
    )
)
GROUP BY i.plantel_id;
