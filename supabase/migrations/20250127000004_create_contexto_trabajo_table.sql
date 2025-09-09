-- Migración: Crear tabla de Contexto de Trabajo del Profesor
-- =====================================================
-- Esta migración crea la tabla para controlar el contexto de trabajo
-- de cada profesor (grado y ciclo escolar activo)

-- 1. TABLA CONTEXTO_TRABAJO
-- =====================================================
CREATE TABLE IF NOT EXISTS contexto_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grado INTEGER NOT NULL CHECK (grado >= 1 AND grado <= 12),
    ciclo_escolar VARCHAR(20) NOT NULL, -- Ej: "2024-2025"
    es_activo BOOLEAN DEFAULT true, -- Solo un contexto activo por profesor
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE, -- Para marcar cuando termina el ciclo
    notas TEXT, -- Notas adicionales del profesor
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    
    -- Constraint para evitar múltiples contextos activos por profesor
    -- Se manejará con un índice único parcial en lugar de constraint
);

-- Índices para contexto_trabajo
CREATE INDEX IF NOT EXISTS idx_contexto_trabajo_profesor_id ON contexto_trabajo(profesor_id);
CREATE INDEX IF NOT EXISTS idx_contexto_trabajo_grado ON contexto_trabajo(grado);
CREATE INDEX IF NOT EXISTS idx_contexto_trabajo_ciclo_escolar ON contexto_trabajo(ciclo_escolar);
CREATE INDEX IF NOT EXISTS idx_contexto_trabajo_es_activo ON contexto_trabajo(es_activo);
CREATE INDEX IF NOT EXISTS idx_contexto_trabajo_profesor_activo ON contexto_trabajo(profesor_id, es_activo);
CREATE INDEX IF NOT EXISTS idx_contexto_trabajo_fecha_inicio ON contexto_trabajo(fecha_inicio);

-- Índice único parcial para evitar múltiples contextos activos por profesor
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_profesor_activo 
ON contexto_trabajo(profesor_id) 
WHERE es_activo = true;

-- Trigger para updated_at en contexto_trabajo
CREATE TRIGGER update_contexto_trabajo_updated_at
    BEFORE UPDATE ON contexto_trabajo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE contexto_trabajo IS 'Tabla para controlar el contexto de trabajo de cada profesor (grado y ciclo escolar activo)';
COMMENT ON COLUMN contexto_trabajo.profesor_id IS 'ID del profesor';
COMMENT ON COLUMN contexto_trabajo.grado IS 'Grado escolar con el que trabaja el profesor (1-12)';
COMMENT ON COLUMN contexto_trabajo.ciclo_escolar IS 'Ciclo escolar en formato YYYY-YYYY (ej: 2024-2025)';
COMMENT ON COLUMN contexto_trabajo.es_activo IS 'Indica si este es el contexto de trabajo activo del profesor';
COMMENT ON COLUMN contexto_trabajo.fecha_inicio IS 'Fecha de inicio del contexto de trabajo';
COMMENT ON COLUMN contexto_trabajo.fecha_fin IS 'Fecha de finalización del contexto de trabajo';
COMMENT ON COLUMN contexto_trabajo.notas IS 'Notas adicionales del profesor sobre su contexto de trabajo';

-- 3. POLÍTICAS RLS PARA CONTEXTO_TRABAJO
-- =====================================================
ALTER TABLE contexto_trabajo ENABLE ROW LEVEL SECURITY;

-- Política para ver contexto de trabajo
CREATE POLICY "Ver contexto de trabajo según permisos" ON contexto_trabajo
    FOR SELECT USING (
        profesor_id = auth.uid() -- El profesor propietario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
        OR EXISTS (
            -- Directores pueden ver contexto de profesores de su plantel
            SELECT 1 FROM profiles p1
            JOIN profiles p2 ON p2.id = contexto_trabajo.profesor_id
            WHERE p1.id = auth.uid()
            AND p1.role = 'director'
            AND p1.plantel_id = p2.plantel_id
        )
    );

-- Política para crear contexto de trabajo
CREATE POLICY "Crear contexto de trabajo según permisos" ON contexto_trabajo
    FOR INSERT WITH CHECK (
        profesor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
    );

-- Política para actualizar contexto de trabajo
CREATE POLICY "Actualizar contexto de trabajo según permisos" ON contexto_trabajo
    FOR UPDATE USING (
        profesor_id = auth.uid() -- El profesor propietario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
        OR EXISTS (
            -- Directores pueden actualizar contexto de profesores de su plantel
            SELECT 1 FROM profiles p1
            JOIN profiles p2 ON p2.id = contexto_trabajo.profesor_id
            WHERE p1.id = auth.uid()
            AND p1.role = 'director'
            AND p1.plantel_id = p2.plantel_id
        )
    );

-- Política para eliminar contexto de trabajo
CREATE POLICY "Eliminar contexto de trabajo según permisos" ON contexto_trabajo
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

-- Función para obtener el contexto de trabajo activo de un profesor
CREATE OR REPLACE FUNCTION get_contexto_trabajo_activo(profesor_id_param UUID)
RETURNS TABLE(
    id UUID,
    grado INTEGER,
    ciclo_escolar VARCHAR,
    fecha_inicio DATE,
    fecha_fin DATE,
    notas TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.ciclo_escolar,
        c.fecha_inicio,
        c.fecha_fin,
        c.notas
    FROM contexto_trabajo c
    WHERE c.profesor_id = profesor_id_param
    AND c.es_activo = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear o actualizar contexto de trabajo
CREATE OR REPLACE FUNCTION set_contexto_trabajo(
    profesor_id_param UUID,
    grado_param INTEGER,
    ciclo_escolar_param VARCHAR,
    notas_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    contexto_id UUID;
BEGIN
    -- Desactivar contexto anterior si existe
    UPDATE contexto_trabajo 
    SET es_activo = false, updated_at = NOW()
    WHERE profesor_id = profesor_id_param 
    AND es_activo = true;
    
    -- Crear nuevo contexto activo
    INSERT INTO contexto_trabajo (
        profesor_id, 
        grado, 
        ciclo_escolar, 
        es_activo, 
        notas
    ) VALUES (
        profesor_id_param, 
        grado_param, 
        ciclo_escolar_param, 
        true, 
        notas_param
    ) RETURNING id INTO contexto_id;
    
    RETURN contexto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para finalizar contexto de trabajo
CREATE OR REPLACE FUNCTION finalizar_contexto_trabajo(
    profesor_id_param UUID,
    fecha_fin_param DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE contexto_trabajo 
    SET 
        es_activo = false,
        fecha_fin = fecha_fin_param,
        updated_at = NOW()
    WHERE profesor_id = profesor_id_param 
    AND es_activo = true;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener historial de contextos de trabajo
CREATE OR REPLACE FUNCTION get_historial_contexto_trabajo(profesor_id_param UUID)
RETURNS TABLE(
    id UUID,
    grado INTEGER,
    ciclo_escolar VARCHAR,
    es_activo BOOLEAN,
    fecha_inicio DATE,
    fecha_fin DATE,
    notas TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.ciclo_escolar,
        c.es_activo,
        c.fecha_inicio,
        c.fecha_fin,
        c.notas,
        c.created_at
    FROM contexto_trabajo c
    WHERE c.profesor_id = profesor_id_param
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER PARA VALIDACIÓN
-- =====================================================

-- Función para validar que solo haya un contexto activo por profesor
CREATE OR REPLACE FUNCTION validate_single_active_contexto()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está activando un contexto, desactivar otros
    IF NEW.es_activo = true THEN
        UPDATE contexto_trabajo 
        SET es_activo = false, updated_at = NOW()
        WHERE profesor_id = NEW.profesor_id 
        AND id != NEW.id 
        AND es_activo = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar contexto único activo
CREATE TRIGGER trigger_validate_single_active_contexto
    BEFORE INSERT OR UPDATE ON contexto_trabajo
    FOR EACH ROW
    EXECUTE FUNCTION validate_single_active_contexto();

COMMENT ON FUNCTION get_contexto_trabajo_activo(UUID) IS 'Obtiene el contexto de trabajo activo de un profesor';
COMMENT ON FUNCTION set_contexto_trabajo(UUID, INTEGER, VARCHAR, TEXT) IS 'Crea o actualiza el contexto de trabajo de un profesor';
COMMENT ON FUNCTION finalizar_contexto_trabajo(UUID, DATE) IS 'Finaliza el contexto de trabajo activo de un profesor';
COMMENT ON FUNCTION get_historial_contexto_trabajo(UUID) IS 'Obtiene el historial de contextos de trabajo de un profesor';
COMMENT ON FUNCTION validate_single_active_contexto() IS 'Valida que solo haya un contexto activo por profesor';
COMMENT ON TRIGGER trigger_validate_single_active_contexto ON contexto_trabajo IS 'Trigger que valida contexto único activo por profesor';
