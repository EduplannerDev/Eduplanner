-- Migración: Crear tabla project_creations para rastrear límites lifetime
-- =====================================================
-- Esta migración crea la tabla para rastrear las creaciones de proyectos
-- y permitir el conteo lifetime para límites de usuarios gratuitos

-- 1. CREAR TABLA PROJECT_CREATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS project_creations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    UNIQUE(user_id, project_id)
);

-- 2. CREAR ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_project_creations_user_id ON project_creations(user_id);
CREATE INDEX IF NOT EXISTS idx_project_creations_created_at ON project_creations(created_at);
CREATE INDEX IF NOT EXISTS idx_project_creations_user_created ON project_creations(user_id, created_at);

-- 3. CONFIGURAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE project_creations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias creaciones de proyectos" ON project_creations;
DROP POLICY IF EXISTS "Usuarios pueden crear registros de creación de proyectos" ON project_creations;
DROP POLICY IF EXISTS "Administradores pueden ver todas las creaciones de proyectos" ON project_creations;

-- Crear políticas
CREATE POLICY "Usuarios pueden ver sus propias creaciones de proyectos" ON project_creations
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

CREATE POLICY "Usuarios pueden crear registros de creación de proyectos" ON project_creations
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Administradores pueden ver todas las creaciones de proyectos" ON project_creations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 4. MIGRAR DATOS EXISTENTES
-- =====================================================
-- Insertar registros para todos los proyectos existentes
INSERT INTO project_creations (user_id, project_id, created_at)
SELECT profesor_id, id, created_at
FROM proyectos
WHERE profesor_id IS NOT NULL
ON CONFLICT (user_id, project_id) DO NOTHING;

-- 5. COMENTARIO DE LA MIGRACIÓN
-- =====================================================
COMMENT ON TABLE project_creations IS 'Tabla para rastrear creaciones de proyectos y aplicar límites lifetime';
