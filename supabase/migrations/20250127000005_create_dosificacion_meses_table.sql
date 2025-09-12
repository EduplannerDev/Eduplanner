-- Migración: Crear tabla dosificacion_meses
-- =====================================================
-- Esta migración crea la tabla para registrar la dosificación
-- de contenidos curriculares por mes del año escolar

-- 1. TABLA DOSIFICACION_MESES
-- =====================================================
CREATE TABLE IF NOT EXISTS dosificacion_meses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contexto_id UUID NOT NULL, -- ID del contexto de trabajo del profesor
    contenido_id INTEGER NOT NULL, -- ID del contenido curricular
    mes VARCHAR(3) NOT NULL CHECK (mes IN ('SEP', 'OCT', 'NOV', 'DIC', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL')),
    seleccionado BOOLEAN NOT NULL DEFAULT false,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT unique_profesor_contexto_contenido_mes UNIQUE(profesor_id, contexto_id, contenido_id, mes)
);

-- Índices para dosificacion_meses
CREATE INDEX IF NOT EXISTS idx_dosificacion_meses_profesor_id ON dosificacion_meses(profesor_id);
CREATE INDEX IF NOT EXISTS idx_dosificacion_meses_contexto_id ON dosificacion_meses(contexto_id);
CREATE INDEX IF NOT EXISTS idx_dosificacion_meses_contenido_id ON dosificacion_meses(contenido_id);
CREATE INDEX IF NOT EXISTS idx_dosificacion_meses_mes ON dosificacion_meses(mes);
CREATE INDEX IF NOT EXISTS idx_dosificacion_meses_profesor_contexto ON dosificacion_meses(profesor_id, contexto_id);

-- Trigger para updated_at
CREATE TRIGGER update_dosificacion_meses_updated_at
    BEFORE UPDATE ON dosificacion_meses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. POLÍTICAS RLS
-- =====================================================
ALTER TABLE dosificacion_meses ENABLE ROW LEVEL SECURITY;

-- Política para ver dosificación de meses
CREATE POLICY "Ver dosificacion_meses según permisos" ON dosificacion_meses
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
            JOIN profiles p2 ON p2.id = dosificacion_meses.profesor_id
            WHERE p1.id = auth.uid()
            AND p1.role = 'director'
            AND p1.plantel_id = p2.plantel_id
        )
    );

-- Política para crear dosificación de meses
CREATE POLICY "Crear dosificacion_meses según permisos" ON dosificacion_meses
    FOR INSERT WITH CHECK (
        profesor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
    );

-- Política para actualizar dosificación de meses
CREATE POLICY "Actualizar dosificacion_meses según permisos" ON dosificacion_meses
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
            JOIN profiles p2 ON p2.id = dosificacion_meses.profesor_id
            WHERE p1.id = auth.uid()
            AND p1.role = 'director'
            AND p1.plantel_id = p2.plantel_id
        )
    );

-- Política para eliminar dosificación de meses
CREATE POLICY "Eliminar dosificacion_meses según permisos" ON dosificacion_meses
    FOR DELETE USING (
        profesor_id = auth.uid() -- El profesor propietario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 3. COMENTARIOS
-- =====================================================
COMMENT ON TABLE dosificacion_meses IS 'Tabla para registrar la dosificación de contenidos curriculares por mes';
COMMENT ON COLUMN dosificacion_meses.profesor_id IS 'ID del profesor que realiza la dosificación';
COMMENT ON COLUMN dosificacion_meses.contexto_id IS 'ID del contexto de trabajo del profesor';
COMMENT ON COLUMN dosificacion_meses.contenido_id IS 'ID del contenido curricular';
COMMENT ON COLUMN dosificacion_meses.mes IS 'Mes del año escolar (SEP, OCT, NOV, etc.)';
COMMENT ON COLUMN dosificacion_meses.seleccionado IS 'Indica si el contenido está seleccionado para ese mes';
COMMENT ON COLUMN dosificacion_meses.fecha_actualizacion IS 'Fecha de la última actualización de la selección';