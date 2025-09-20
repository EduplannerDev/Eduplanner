-- Migración: Simplificar estados de proyectos
-- =====================================================
-- Los proyectos se crean completos (activos) porque ya tienen
-- el plan didáctico generado por IA

-- 1. ACTUALIZAR PROYECTOS EXISTENTES
-- =====================================================
-- Cambiar todos los proyectos 'borrador' a 'activo'
UPDATE proyectos 
SET estado = 'activo' 
WHERE estado = 'borrador';

-- 2. ACTUALIZAR CONSTRAINT DE ESTADOS
-- =====================================================
-- Simplificar a solo 2 estados: activo y archivado
ALTER TABLE proyectos 
DROP CONSTRAINT IF EXISTS proyectos_estado_check;

ALTER TABLE proyectos 
ADD CONSTRAINT proyectos_estado_check 
CHECK (estado IN ('activo', 'archivado'));

-- 3. CAMBIAR VALOR POR DEFECTO
-- =====================================================
-- Los proyectos se crean como 'activo' por defecto
ALTER TABLE proyectos 
ALTER COLUMN estado SET DEFAULT 'activo';

-- 4. COMENTARIOS ACTUALIZADOS
-- =====================================================
COMMENT ON COLUMN proyectos.estado IS 'Estado del proyecto: activo (en uso) o archivado (terminado)';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Estados de proyectos simplificados exitosamente';
    RAISE NOTICE 'Estados disponibles: activo, archivado';
    RAISE NOTICE 'Valor por defecto: activo';
END $$;
