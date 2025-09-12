-- Migración: Crear tabla de relación entre planeaciones y contenidos curriculares
-- =====================================================
-- Esta migración crea una tabla para relacionar planeaciones con contenidos
-- curriculares específicos, permitiendo rastrear qué contenidos ya tienen planeaciones

-- 1. TABLA PLANEACION_CONTENIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS planeacion_contenidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planeacion_id UUID NOT NULL REFERENCES planeaciones(id) ON DELETE CASCADE,
    contenido_id UUID NOT NULL REFERENCES curriculo_sep(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT unique_planeacion_contenido UNIQUE(planeacion_id, contenido_id)
);

-- 2. ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_planeacion_contenidos_planeacion_id ON planeacion_contenidos(planeacion_id);
CREATE INDEX IF NOT EXISTS idx_planeacion_contenidos_contenido_id ON planeacion_contenidos(contenido_id);
CREATE INDEX IF NOT EXISTS idx_planeacion_contenidos_created_at ON planeacion_contenidos(created_at);

-- 3. TRIGGER PARA UPDATED_AT
-- =====================================================
-- No necesitamos updated_at para esta tabla de relación

-- 4. POLÍTICAS RLS
-- =====================================================
ALTER TABLE planeacion_contenidos ENABLE ROW LEVEL SECURITY;

-- Política para ver relaciones de planeación-contenido
CREATE POLICY "Ver planeacion_contenidos según permisos" ON planeacion_contenidos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM planeaciones p
            WHERE p.id = planeacion_contenidos.planeacion_id
            AND p.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles pr
            WHERE pr.id = auth.uid()
            AND pr.role = 'administrador'
        )
    );

-- Política para crear relaciones de planeación-contenido
CREATE POLICY "Crear planeacion_contenidos según permisos" ON planeacion_contenidos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM planeaciones p
            WHERE p.id = planeacion_contenidos.planeacion_id
            AND p.user_id = auth.uid()
        )
    );

-- Política para actualizar relaciones de planeación-contenido
CREATE POLICY "Actualizar planeacion_contenidos según permisos" ON planeacion_contenidos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM planeaciones p
            WHERE p.id = planeacion_contenidos.planeacion_id
            AND p.user_id = auth.uid()
        )
    );

-- Política para eliminar relaciones de planeación-contenido
CREATE POLICY "Eliminar planeacion_contenidos según permisos" ON planeacion_contenidos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM planeaciones p
            WHERE p.id = planeacion_contenidos.planeacion_id
            AND p.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles pr
            WHERE pr.id = auth.uid()
            AND pr.role = 'administrador'
        )
    );

-- 5. COMENTARIOS
-- =====================================================
COMMENT ON TABLE planeacion_contenidos IS 'Tabla de relación entre planeaciones y contenidos curriculares';
COMMENT ON COLUMN planeacion_contenidos.planeacion_id IS 'ID de la planeación';
COMMENT ON COLUMN planeacion_contenidos.contenido_id IS 'ID del contenido curricular';
COMMENT ON COLUMN planeacion_contenidos.created_at IS 'Fecha de creación de la relación';
