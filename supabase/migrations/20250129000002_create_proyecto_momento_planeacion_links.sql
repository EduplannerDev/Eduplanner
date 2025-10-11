-- Migración: Crear tabla de enlaces entre momentos de proyecto y planeaciones
-- =====================================================
-- Esta migración crea una tabla para enlazar momentos específicos de proyectos
-- con planeaciones existentes

-- 1. CREAR TABLA DE ENLACES PROYECTO_MOMENTO_PLANEACION
-- =====================================================
CREATE TABLE IF NOT EXISTS proyecto_momento_planeacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_fase_id UUID NOT NULL REFERENCES proyecto_fases(id) ON DELETE CASCADE,
    planeacion_id UUID NOT NULL REFERENCES planeaciones(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT unique_proyecto_fase_planeacion UNIQUE(proyecto_fase_id, planeacion_id)
);

-- 2. CREAR ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_proyecto_momento_planeacion_fase_id ON proyecto_momento_planeacion(proyecto_fase_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_momento_planeacion_planeacion_id ON proyecto_momento_planeacion(planeacion_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_momento_planeacion_created_at ON proyecto_momento_planeacion(created_at);

-- 3. CREAR TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE TRIGGER update_proyecto_momento_planeacion_updated_at
    BEFORE UPDATE ON proyecto_momento_planeacion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. CREAR FUNCIÓN PARA OBTENER MOMENTOS CON PLANEACIONES ENLAZADAS
-- =====================================================
CREATE OR REPLACE FUNCTION get_proyecto_fases_with_links(proyecto_uuid UUID)
RETURNS TABLE(
    id UUID,
    proyecto_id UUID,
    fase_nombre VARCHAR(255),
    momento_nombre VARCHAR(255),
    contenido TEXT,
    orden INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    linked_planeacion_id UUID,
    linked_planeacion_titulo VARCHAR(255),
    linked_planeacion_materia VARCHAR(100),
    linked_planeacion_grado VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.proyecto_id,
        pf.fase_nombre,
        pf.momento_nombre,
        pf.contenido,
        pf.orden,
        pf.created_at,
        pf.updated_at,
        pmp.planeacion_id as linked_planeacion_id,
        p.titulo as linked_planeacion_titulo,
        p.materia as linked_planeacion_materia,
        p.grado as linked_planeacion_grado
    FROM proyecto_fases pf
    LEFT JOIN proyecto_momento_planeacion pmp ON pf.id = pmp.proyecto_fase_id
    LEFT JOIN planeaciones p ON pmp.planeacion_id = p.id
    WHERE pf.proyecto_id = proyecto_uuid
    ORDER BY pf.orden;
END;
$$ LANGUAGE plpgsql;

-- 5. CREAR RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE proyecto_momento_planeacion ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los profesores ver sus propios enlaces
CREATE POLICY "Profesores pueden ver sus propios enlaces de proyecto-momento-planeacion"
    ON proyecto_momento_planeacion
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM proyecto_fases pf
            JOIN proyectos pr ON pf.proyecto_id = pr.id
            WHERE pf.id = proyecto_momento_planeacion.proyecto_fase_id
            AND pr.profesor_id = auth.uid()
        )
    );

-- Política para permitir a los profesores crear enlaces en sus proyectos
CREATE POLICY "Profesores pueden crear enlaces en sus propios proyectos"
    ON proyecto_momento_planeacion
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM proyecto_fases pf
            JOIN proyectos pr ON pf.proyecto_id = pr.id
            WHERE pf.id = proyecto_momento_planeacion.proyecto_fase_id
            AND pr.profesor_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM planeaciones p
            WHERE p.id = proyecto_momento_planeacion.planeacion_id
            AND p.user_id = auth.uid()
        )
    );

-- Política para permitir a los profesores eliminar enlaces de sus proyectos
CREATE POLICY "Profesores pueden eliminar enlaces de sus propios proyectos"
    ON proyecto_momento_planeacion
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM proyecto_fases pf
            JOIN proyectos pr ON pf.proyecto_id = pr.id
            WHERE pf.id = proyecto_momento_planeacion.proyecto_fase_id
            AND pr.profesor_id = auth.uid()
        )
    );

-- 6. COMENTARIOS
-- =====================================================
COMMENT ON TABLE proyecto_momento_planeacion IS 'Tabla de enlaces entre momentos específicos de proyectos y planeaciones';
COMMENT ON COLUMN proyecto_momento_planeacion.proyecto_fase_id IS 'ID del momento/fase del proyecto';
COMMENT ON COLUMN proyecto_momento_planeacion.planeacion_id IS 'ID de la planeación enlazada';
COMMENT ON FUNCTION get_proyecto_fases_with_links(UUID) IS 'Obtiene las fases de un proyecto con información de planeaciones enlazadas';
