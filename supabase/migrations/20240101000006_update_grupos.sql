-- Migración: Actualizar tabla grupos
-- =====================================================
-- Esta migración actualiza la tabla grupos para incluir
-- plantel_id y campo activo

-- 1. AGREGAR NUEVAS COLUMNAS A GRUPOS
-- =====================================================
-- Agregar plantel_id
ALTER TABLE grupos 
ADD COLUMN IF NOT EXISTS plantel_id UUID REFERENCES planteles(id);

-- Agregar activo
ALTER TABLE grupos 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Agregar updated_at si no existe
ALTER TABLE grupos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. CREAR TRIGGER PARA UPDATED_AT EN GRUPOS
-- =====================================================
DROP TRIGGER IF EXISTS update_grupos_updated_at ON grupos;
CREATE TRIGGER update_grupos_updated_at
    BEFORE UPDATE ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. CREAR ÍNDICES PARA GRUPOS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_grupos_plantel_id ON grupos(plantel_id);
CREATE INDEX IF NOT EXISTS idx_grupos_activo ON grupos(activo);
-- Nota: idx_grupos_user_id ya existe desde create_grupos_table.sql

-- 4. ACTUALIZAR GRUPOS EXISTENTES
-- =====================================================
-- Asignar plantel_id basado en el plantel del usuario propietario
UPDATE grupos 
SET 
    plantel_id = p.plantel_id,
    activo = true,
    updated_at = NOW()
FROM profiles p 
WHERE grupos.user_id = p.id 
AND grupos.plantel_id IS NULL;

-- 5. COMENTARIOS PARA GRUPOS
-- =====================================================
COMMENT ON COLUMN grupos.plantel_id IS 'ID del plantel al que pertenece el grupo';
COMMENT ON COLUMN grupos.activo IS 'Estado activo/inactivo del grupo';

-- 6. CREAR CONSTRAINT PARA ASEGURAR CONSISTENCIA
-- =====================================================
-- Asegurar que el plantel del grupo coincida con el del usuario (opcional)
-- Solo si se quiere forzar esta regla de negocio
-- ALTER TABLE grupos 
-- ADD CONSTRAINT check_grupo_plantel_consistency 
-- CHECK (
--     plantel_id IN (
--         SELECT plantel_id FROM profiles WHERE id = user_id
--         UNION
--         SELECT plantel_id FROM user_plantel_assignments WHERE user_id = grupos.user_id
--     )
-- );