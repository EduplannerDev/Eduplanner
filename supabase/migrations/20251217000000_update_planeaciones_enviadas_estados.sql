-- Migración: Actualizar estados de planeaciones_enviadas para permitir aprobada/cambios_solicitados
-- =====================================================

-- 1. Primero eliminar el constraint antiguo
ALTER TABLE planeaciones_enviadas 
DROP CONSTRAINT IF EXISTS planeaciones_enviadas_estado_check;

-- 2. Actualizar registros existentes con 'revisada' a 'aprobada'
UPDATE planeaciones_enviadas
SET estado = 'aprobada'
WHERE estado = 'revisada';

-- 3. Agregar el nuevo constraint con los nuevos estados
ALTER TABLE planeaciones_enviadas
ADD CONSTRAINT planeaciones_enviadas_estado_check 
CHECK (estado IN ('pendiente', 'aprobada', 'cambios_solicitados'));

-- Agregar columna para registrar la acción de revisión
ALTER TABLE planeaciones_enviadas
ADD COLUMN IF NOT EXISTS accion_revision VARCHAR(30);

-- Comentarios actualizados
COMMENT ON COLUMN planeaciones_enviadas.estado IS 'Estado del envío: pendiente, aprobada, o cambios_solicitados';
COMMENT ON COLUMN planeaciones_enviadas.accion_revision IS 'Acción tomada en última revisión: aprobar o solicitar_cambios';
