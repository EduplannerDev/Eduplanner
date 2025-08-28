-- Migración: Crear tablas de Planeaciones y Exámenes
-- =====================================================
-- Esta migración crea las tablas principales del sistema educativo:
-- planeaciones y examenes

-- 1. TABLA PLANEACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS planeaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    materia VARCHAR(100),
    grado VARCHAR(50),
    duracion VARCHAR(50),
    objetivo TEXT,
    contenido TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'completada', 'archivada')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Índices para planeaciones
CREATE INDEX IF NOT EXISTS idx_planeaciones_user_id ON planeaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_estado ON planeaciones(estado);
CREATE INDEX IF NOT EXISTS idx_planeaciones_created_at ON planeaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_planeaciones_deleted_at ON planeaciones(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planeaciones_materia ON planeaciones(materia);
CREATE INDEX IF NOT EXISTS idx_planeaciones_grado ON planeaciones(grado);

-- Trigger para updated_at en planeaciones
CREATE TRIGGER update_planeaciones_updated_at
    BEFORE UPDATE ON planeaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLA EXAMENES
-- =====================================================
CREATE TABLE IF NOT EXISTS examenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    subject VARCHAR(100),
    content JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    shared_with UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para examenes
CREATE INDEX IF NOT EXISTS idx_examenes_owner_id ON examenes(owner_id);
CREATE INDEX IF NOT EXISTS idx_examenes_is_public ON examenes(is_public);
CREATE INDEX IF NOT EXISTS idx_examenes_created_at ON examenes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_examenes_subject ON examenes(subject);
CREATE INDEX IF NOT EXISTS idx_examenes_shared_with ON examenes USING GIN(shared_with);

-- Trigger para updated_at en examenes
CREATE TRIGGER update_examenes_updated_at
    BEFORE UPDATE ON examenes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE planeaciones IS 'Tabla para almacenar las planeaciones didácticas de los profesores';
COMMENT ON COLUMN planeaciones.user_id IS 'ID del profesor que creó la planeación';
COMMENT ON COLUMN planeaciones.titulo IS 'Título de la planeación';
COMMENT ON COLUMN planeaciones.materia IS 'Materia o asignatura de la planeación';
COMMENT ON COLUMN planeaciones.grado IS 'Grado escolar al que está dirigida';
COMMENT ON COLUMN planeaciones.duracion IS 'Duración estimada de la clase';
COMMENT ON COLUMN planeaciones.objetivo IS 'Objetivo de aprendizaje';
COMMENT ON COLUMN planeaciones.contenido IS 'Contenido completo de la planeación';
COMMENT ON COLUMN planeaciones.estado IS 'Estado actual de la planeación';
COMMENT ON COLUMN planeaciones.deleted_at IS 'Fecha de eliminación suave (soft delete)';

COMMENT ON TABLE examenes IS 'Tabla para almacenar los exámenes generados por los profesores';
COMMENT ON COLUMN examenes.owner_id IS 'ID del profesor que creó el examen';
COMMENT ON COLUMN examenes.title IS 'Título del examen';
COMMENT ON COLUMN examenes.subject IS 'Materia del examen';
COMMENT ON COLUMN examenes.content IS 'Contenido del examen en formato JSON';
COMMENT ON COLUMN examenes.is_public IS 'Indica si el examen es público';
COMMENT ON COLUMN examenes.shared_with IS 'Array de IDs de usuarios con quienes se comparte el examen';

-- 4. POLÍTICAS RLS PARA PLANEACIONES
-- =====================================================
ALTER TABLE planeaciones ENABLE ROW LEVEL SECURITY;

-- Política para ver planeaciones
CREATE POLICY "Usuarios pueden ver sus propias planeaciones" ON planeaciones
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para crear planeaciones
CREATE POLICY "Usuarios pueden crear planeaciones" ON planeaciones
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
    );

-- Política para actualizar planeaciones
CREATE POLICY "Usuarios pueden actualizar sus planeaciones" ON planeaciones
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar planeaciones
CREATE POLICY "Usuarios pueden eliminar sus planeaciones" ON planeaciones
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 5. POLÍTICAS RLS PARA EXAMENES
-- =====================================================
ALTER TABLE examenes ENABLE ROW LEVEL SECURITY;

-- Política para ver exámenes
CREATE POLICY "Usuarios pueden ver exámenes según permisos" ON examenes
    FOR SELECT USING (
        owner_id = auth.uid() -- Propietario
        OR is_public = true -- Exámenes públicos
        OR auth.uid() = ANY(shared_with) -- Compartidos con el usuario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para crear exámenes
CREATE POLICY "Usuarios pueden crear exámenes" ON examenes
    FOR INSERT WITH CHECK (
        owner_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
    );

-- Política para actualizar exámenes
CREATE POLICY "Usuarios pueden actualizar sus exámenes" ON examenes
    FOR UPDATE USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar exámenes
CREATE POLICY "Usuarios pueden eliminar sus exámenes" ON examenes
    FOR DELETE USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 6. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener estadísticas de planeaciones
CREATE OR REPLACE FUNCTION get_planeaciones_stats(user_id_param UUID)
RETURNS TABLE(
    total_planeaciones BIGINT,
    planeaciones_mes BIGINT,
    por_estado JSONB,
    por_materia JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_planeaciones,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as planeaciones_mes,
        jsonb_object_agg(estado, count_estado) as por_estado,
        jsonb_object_agg(COALESCE(materia, 'Sin materia'), count_materia) as por_materia
    FROM (
        SELECT 
            estado,
            materia,
            COUNT(*) OVER (PARTITION BY estado) as count_estado,
            COUNT(*) OVER (PARTITION BY materia) as count_materia
        FROM planeaciones 
        WHERE user_id = user_id_param 
        AND deleted_at IS NULL
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de exámenes
CREATE OR REPLACE FUNCTION get_examenes_stats(user_id_param UUID)
RETURNS TABLE(
    total_examenes BIGINT,
    examenes_publicos BIGINT,
    examenes_compartidos BIGINT,
    por_materia JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_examenes,
        COUNT(*) FILTER (WHERE is_public = true) as examenes_publicos,
        COUNT(*) FILTER (WHERE array_length(shared_with, 1) > 0) as examenes_compartidos,
        jsonb_object_agg(COALESCE(subject, 'Sin materia'), count_materia) as por_materia
    FROM (
        SELECT 
            subject,
            is_public,
            shared_with,
            COUNT(*) OVER (PARTITION BY subject) as count_materia
        FROM examenes 
        WHERE owner_id = user_id_param
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_planeaciones_stats(UUID) IS 'Obtiene estadísticas de planeaciones para un usuario';
COMMENT ON FUNCTION get_examenes_stats(UUID) IS 'Obtiene estadísticas de exámenes para un usuario';