-- Migración: Crear tabla group_creations para rastrear límites lifetime
-- =====================================================
-- Esta migración crea la tabla para rastrear las creaciones de grupos
-- y permitir el conteo lifetime para límites de usuarios gratuitos

-- 1. CREAR TABLA GROUP_CREATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS group_creations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    UNIQUE(user_id, group_id)
);

-- 2. CREAR ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_group_creations_user_id ON group_creations(user_id);
CREATE INDEX IF NOT EXISTS idx_group_creations_created_at ON group_creations(created_at);
CREATE INDEX IF NOT EXISTS idx_group_creations_user_created ON group_creations(user_id, created_at);

-- 3. CONFIGURAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE group_creations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias creaciones de grupos" ON group_creations;
DROP POLICY IF EXISTS "Usuarios pueden crear registros de creación de grupos" ON group_creations;
DROP POLICY IF EXISTS "Administradores pueden ver todas las creaciones de grupos" ON group_creations;

-- Crear políticas
CREATE POLICY "Usuarios pueden ver sus propias creaciones de grupos" ON group_creations
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

CREATE POLICY "Usuarios pueden crear registros de creación de grupos" ON group_creations
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Administradores pueden ver todas las creaciones de grupos" ON group_creations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 4. MIGRAR DATOS EXISTENTES
-- =====================================================
-- Insertar registros para todos los grupos existentes
INSERT INTO group_creations (user_id, group_id, created_at)
SELECT user_id, id, created_at
FROM grupos
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;

-- 5. COMENTARIO DE LA MIGRACIÓN
-- =====================================================
COMMENT ON TABLE group_creations IS 'Tabla para rastrear creaciones de grupos y aplicar límites lifetime';
