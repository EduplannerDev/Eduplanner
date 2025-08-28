-- Migración: Crear tabla planeacion_creations
-- =====================================================
-- Esta migración crea la tabla para rastrear las creaciones de planeaciones
-- y permitir el conteo mensual para límites de usuarios gratuitos

-- 1. CREAR TABLA PLANEACION_CREATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS planeacion_creations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    planeacion_id UUID NOT NULL REFERENCES planeaciones(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    UNIQUE(user_id, planeacion_id)
);

-- 2. CREAR ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_planeacion_creations_user_id ON planeacion_creations(user_id);
CREATE INDEX IF NOT EXISTS idx_planeacion_creations_created_at ON planeacion_creations(created_at);
CREATE INDEX IF NOT EXISTS idx_planeacion_creations_user_created ON planeacion_creations(user_id, created_at);

-- 3. CONFIGURAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE planeacion_creations ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias creaciones
CREATE POLICY "Usuarios pueden ver sus propias creaciones" ON planeacion_creations
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para crear registros de creación
CREATE POLICY "Usuarios pueden crear registros de creación" ON planeacion_creations
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Política para que los administradores puedan ver todo
CREATE POLICY "Administradores pueden ver todas las creaciones" ON planeacion_creations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 4. COMENTARIOS
-- =====================================================
COMMENT ON TABLE planeacion_creations IS 'Tabla para rastrear las creaciones de planeaciones y permitir conteo mensual';
COMMENT ON COLUMN planeacion_creations.user_id IS 'ID del usuario que creó la planeación';
COMMENT ON COLUMN planeacion_creations.planeacion_id IS 'ID de la planeación creada';
COMMENT ON COLUMN planeacion_creations.created_at IS 'Fecha y hora de creación del registro';