-- Migración: Crear tabla exam_creations para rastrear límites lifetime
-- =====================================================
-- Esta migración crea la tabla para rastrear las creaciones de exámenes
-- y permitir el conteo lifetime para límites de usuarios gratuitos

-- 1. CREAR TABLA EXAM_CREATIONS (si no existe)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_creations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    UNIQUE(user_id, exam_id)
);

-- 2. CREAR ÍNDICES (si no existen)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_exam_creations_user_id ON exam_creations(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_creations_created_at ON exam_creations(created_at);
CREATE INDEX IF NOT EXISTS idx_exam_creations_user_created ON exam_creations(user_id, created_at);

-- 3. CONFIGURAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE exam_creations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias creaciones de exámenes" ON exam_creations;
DROP POLICY IF EXISTS "Usuarios pueden crear registros de creación de exámenes" ON exam_creations;
DROP POLICY IF EXISTS "Administradores pueden ver todas las creaciones de exámenes" ON exam_creations;

-- Crear políticas
CREATE POLICY "Usuarios pueden ver sus propias creaciones de exámenes" ON exam_creations
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

CREATE POLICY "Usuarios pueden crear registros de creación de exámenes" ON exam_creations
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Administradores pueden ver todas las creaciones de exámenes" ON exam_creations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 4. MIGRAR DATOS EXISTENTES
-- =====================================================
-- Insertar registros para todos los exámenes existentes
INSERT INTO exam_creations (user_id, exam_id, created_at)
SELECT owner_id, id, created_at
FROM examenes
WHERE owner_id IS NOT NULL
ON CONFLICT (user_id, exam_id) DO NOTHING;

-- 5. ACTUALIZAR FUNCIÓN PARA OBTENER LÍMITES DE USUARIO
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_limits(user_id UUID)
RETURNS TABLE(
    planeaciones_limit INTEGER,
    examenes_limit INTEGER,
    mensajes_limit INTEGER
) AS $$
DECLARE
    is_pro BOOLEAN;
BEGIN
    SELECT public.is_user_pro(user_id) INTO is_pro;
    
    IF is_pro THEN
        -- Límites para usuarios pro (ilimitado = -1)
        RETURN QUERY SELECT -1, -1, -1;
    ELSE
        -- Límites para usuarios free (actualizado: exámenes de 3 a 2)
        RETURN QUERY SELECT 5, 2, 10;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. COMENTARIO DE LA MIGRACIÓN
-- =====================================================
COMMENT ON TABLE exam_creations IS 'Tabla para rastrear creaciones de exámenes y aplicar límites lifetime';
COMMENT ON FUNCTION public.get_user_limits(UUID) IS 'Función actualizada: límite de exámenes cambiado de 3 a 2 para usuarios free';
