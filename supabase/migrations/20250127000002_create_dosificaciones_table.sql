-- Migración: Crear tabla Dosificaciones (Plan del Profesor)
-- =====================================================
-- Esta migración crea la tabla para registrar las decisiones de dosificación
-- de cada profesor. Vincula profesores con PDAs del currículo y trimestres.

-- 1. TABLA DOSIFICACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS dosificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    curriculo_id UUID NOT NULL REFERENCES curriculo_sep(id) ON DELETE CASCADE,
    ciclo_escolar VARCHAR(20) NOT NULL, -- Ej: "2024-2025"
    trimestre INTEGER NOT NULL CHECK (trimestre IN (1, 2, 3)),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'visto_en_clase', 'evaluado')),
    fecha_planeada DATE, -- Fecha en que se planea ver el contenido
    fecha_impartida DATE, -- Fecha en que realmente se impartió
    notas_profesor TEXT, -- Notas adicionales del profesor
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados por profesor, currículo y ciclo escolar
    CONSTRAINT unique_profesor_curriculo_ciclo UNIQUE(profesor_id, curriculo_id, ciclo_escolar)
);

-- Índices para dosificaciones
CREATE INDEX IF NOT EXISTS idx_dosificaciones_profesor_id ON dosificaciones(profesor_id);
CREATE INDEX IF NOT EXISTS idx_dosificaciones_curriculo_id ON dosificaciones(curriculo_id);
CREATE INDEX IF NOT EXISTS idx_dosificaciones_ciclo_escolar ON dosificaciones(ciclo_escolar);
CREATE INDEX IF NOT EXISTS idx_dosificaciones_trimestre ON dosificaciones(trimestre);
CREATE INDEX IF NOT EXISTS idx_dosificaciones_estado ON dosificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_dosificaciones_profesor_ciclo ON dosificaciones(profesor_id, ciclo_escolar);
CREATE INDEX IF NOT EXISTS idx_dosificaciones_profesor_trimestre ON dosificaciones(profesor_id, ciclo_escolar, trimestre);
CREATE INDEX IF NOT EXISTS idx_dosificaciones_fecha_planeada ON dosificaciones(fecha_planeada);
CREATE INDEX IF NOT EXISTS idx_dosificaciones_fecha_impartida ON dosificaciones(fecha_impartida);

-- Trigger para updated_at en dosificaciones
CREATE TRIGGER update_dosificaciones_updated_at
    BEFORE UPDATE ON dosificaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE dosificaciones IS 'Tabla para registrar las decisiones de dosificación de cada profesor';
COMMENT ON COLUMN dosificaciones.profesor_id IS 'ID del profesor que realiza la dosificación';
COMMENT ON COLUMN dosificaciones.curriculo_id IS 'ID del contenido curricular (PDA) del currículo SEP';
COMMENT ON COLUMN dosificaciones.ciclo_escolar IS 'Ciclo escolar en formato YYYY-YYYY (ej: 2024-2025)';
COMMENT ON COLUMN dosificaciones.trimestre IS 'Trimestre en que se planea impartir (1, 2, o 3)';
COMMENT ON COLUMN dosificaciones.estado IS 'Estado del contenido: pendiente, visto_en_clase, evaluado';
COMMENT ON COLUMN dosificaciones.fecha_planeada IS 'Fecha planificada para impartir el contenido';
COMMENT ON COLUMN dosificaciones.fecha_impartida IS 'Fecha real en que se impartió el contenido';
COMMENT ON COLUMN dosificaciones.notas_profesor IS 'Notas adicionales del profesor sobre el contenido';

-- 3. POLÍTICAS RLS PARA DOSIFICACIONES
-- =====================================================
ALTER TABLE dosificaciones ENABLE ROW LEVEL SECURITY;

-- Política para ver dosificaciones
CREATE POLICY "Ver dosificaciones según rol y permisos" ON dosificaciones
    FOR SELECT USING (
        profesor_id = auth.uid() -- El profesor propietario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
        OR EXISTS (
            -- Directores pueden ver dosificaciones de profesores de su plantel
            SELECT 1 FROM profiles p1
            JOIN profiles p2 ON p2.id = dosificaciones.profesor_id
            WHERE p1.id = auth.uid()
            AND p1.role = 'director'
            AND p1.plantel_id = p2.plantel_id
        )
    );

-- Política para crear dosificaciones
CREATE POLICY "Crear dosificaciones según permisos" ON dosificaciones
    FOR INSERT WITH CHECK (
        profesor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
    );

-- Política para actualizar dosificaciones
CREATE POLICY "Actualizar dosificaciones según permisos" ON dosificaciones
    FOR UPDATE USING (
        profesor_id = auth.uid() -- El profesor propietario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
        OR EXISTS (
            -- Directores pueden actualizar dosificaciones de profesores de su plantel
            SELECT 1 FROM profiles p1
            JOIN profiles p2 ON p2.id = dosificaciones.profesor_id
            WHERE p1.id = auth.uid()
            AND p1.role = 'director'
            AND p1.plantel_id = p2.plantel_id
        )
    );

-- Política para eliminar dosificaciones
CREATE POLICY "Eliminar dosificaciones según permisos" ON dosificaciones
    FOR DELETE USING (
        profesor_id = auth.uid() -- El profesor propietario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 4. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener dosificación de un profesor por ciclo escolar
CREATE OR REPLACE FUNCTION get_dosificacion_profesor(
    profesor_id_param UUID,
    ciclo_escolar_param VARCHAR,
    trimestre_param INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    curriculo_id UUID,
    grado INTEGER,
    campo_formativo VARCHAR,
    contenido TEXT,
    pda TEXT,
    trimestre INTEGER,
    estado VARCHAR,
    fecha_planeada DATE,
    fecha_impartida DATE,
    notas_profesor TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.curriculo_id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        d.trimestre,
        d.estado,
        d.fecha_planeada,
        d.fecha_impartida,
        d.notas_profesor
    FROM dosificaciones d
    JOIN curriculo_sep c ON c.id = d.curriculo_id
    WHERE d.profesor_id = profesor_id_param
    AND d.ciclo_escolar = ciclo_escolar_param
    AND (trimestre_param IS NULL OR d.trimestre = trimestre_param)
    ORDER BY d.trimestre, c.grado, c.campo_formativo, c.contenido;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de dosificación por profesor
CREATE OR REPLACE FUNCTION get_dosificacion_stats(
    profesor_id_param UUID,
    ciclo_escolar_param VARCHAR
)
RETURNS TABLE(
    total_contenidos BIGINT,
    por_trimestre JSONB,
    por_estado JSONB,
    por_campo_formativo JSONB,
    avance_general NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_contenidos,
        jsonb_object_agg(trimestre::text, count_trimestre) as por_trimestre,
        jsonb_object_agg(estado, count_estado) as por_estado,
        jsonb_object_agg(campo_formativo, count_campo) as por_campo_formativo,
        ROUND(
            (COUNT(*) FILTER (WHERE estado IN ('visto_en_clase', 'evaluado'))::NUMERIC / 
             NULLIF(COUNT(*), 0) * 100), 2
        ) as avance_general
    FROM (
        SELECT 
            d.trimestre,
            d.estado,
            c.campo_formativo,
            COUNT(*) OVER (PARTITION BY d.trimestre) as count_trimestre,
            COUNT(*) OVER (PARTITION BY d.estado) as count_estado,
            COUNT(*) OVER (PARTITION BY c.campo_formativo) as count_campo
        FROM dosificaciones d
        JOIN curriculo_sep c ON c.id = d.curriculo_id
        WHERE d.profesor_id = profesor_id_param
        AND d.ciclo_escolar = ciclo_escolar_param
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener contenidos curriculares no dosificados
CREATE OR REPLACE FUNCTION get_contenidos_no_dosificados(
    profesor_id_param UUID,
    ciclo_escolar_param VARCHAR,
    grado_param INTEGER
)
RETURNS TABLE(
    id UUID,
    grado INTEGER,
    campo_formativo VARCHAR,
    contenido TEXT,
    pda TEXT,
    ejes_articuladores TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores
    FROM curriculo_sep c
    WHERE c.grado = grado_param
    AND NOT EXISTS (
        SELECT 1 FROM dosificaciones d
        WHERE d.curriculo_id = c.id
        AND d.profesor_id = profesor_id_param
        AND d.ciclo_escolar = ciclo_escolar_param
    )
    ORDER BY c.campo_formativo, c.contenido;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar contenido como visto en clase
CREATE OR REPLACE FUNCTION marcar_contenido_visto(
    dosificacion_id_param UUID,
    fecha_impartida_param DATE DEFAULT CURRENT_DATE,
    notas_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE dosificaciones 
    SET 
        estado = 'visto_en_clase',
        fecha_impartida = fecha_impartida_param,
        notas_profesor = COALESCE(notas_param, notas_profesor),
        updated_at = NOW()
    WHERE id = dosificacion_id_param
    AND profesor_id = auth.uid(); -- Solo el profesor propietario puede marcar
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar contenido como evaluado
CREATE OR REPLACE FUNCTION marcar_contenido_evaluado(
    dosificacion_id_param UUID,
    notas_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE dosificaciones 
    SET 
        estado = 'evaluado',
        notas_profesor = COALESCE(notas_param, notas_profesor),
        updated_at = NOW()
    WHERE id = dosificacion_id_param
    AND profesor_id = auth.uid() -- Solo el profesor propietario puede marcar
    AND estado = 'visto_en_clase'; -- Solo se puede evaluar lo que ya se vio
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. VISTA PARA REPORTES
-- =====================================================

-- Vista que une dosificaciones con información del currículo y profesor
CREATE OR REPLACE VIEW vista_dosificacion_completa AS
SELECT 
    d.id as dosificacion_id,
    d.profesor_id,
    p.full_name as profesor_nombre,
    p.plantel_id,
    pl.nombre as plantel_nombre,
    d.ciclo_escolar,
    d.trimestre,
    d.estado,
    d.fecha_planeada,
    d.fecha_impartida,
    d.notas_profesor,
    c.id as curriculo_id,
    c.grado,
    c.campo_formativo,
    c.contenido,
    c.pda,
    c.ejes_articuladores,
    d.created_at,
    d.updated_at
FROM dosificaciones d
JOIN curriculo_sep c ON c.id = d.curriculo_id
JOIN profiles p ON p.id = d.profesor_id
LEFT JOIN planteles pl ON pl.id = p.plantel_id;

COMMENT ON VIEW vista_dosificacion_completa IS 'Vista completa de dosificaciones con información de currículo, profesor y plantel';

COMMENT ON FUNCTION get_dosificacion_profesor(UUID, VARCHAR, INTEGER) IS 'Obtiene la dosificación de un profesor por ciclo escolar y trimestre';
COMMENT ON FUNCTION get_dosificacion_stats(UUID, VARCHAR) IS 'Obtiene estadísticas de dosificación de un profesor';
COMMENT ON FUNCTION get_contenidos_no_dosificados(UUID, VARCHAR, INTEGER) IS 'Obtiene contenidos curriculares que no han sido dosificados';
COMMENT ON FUNCTION marcar_contenido_visto(UUID, DATE, TEXT) IS 'Marca un contenido como visto en clase';
COMMENT ON FUNCTION marcar_contenido_evaluado(UUID, TEXT) IS 'Marca un contenido como evaluado';
