-- Migración: Agregar campos para identificar el origen de las planeaciones
-- =====================================================
-- Esta migración agrega campos para rastrear el origen de las planeaciones
-- y distinguir entre planeaciones normales y las que vienen desde dosificación

-- 1. AGREGAR CAMPOS A LA TABLA PLANEACIONES
-- =====================================================

-- Agregar campo para identificar el origen de la planeación
ALTER TABLE planeaciones ADD COLUMN IF NOT EXISTS origen VARCHAR(20) DEFAULT 'manual' 
CHECK (origen IN ('manual', 'dosificacion'));

-- Agregar campo para almacenar IDs de contenidos relacionados (JSON)
ALTER TABLE planeaciones ADD COLUMN IF NOT EXISTS contenidos_relacionados JSONB DEFAULT NULL;

-- Agregar campo para el mes de dosificación (si aplica)
ALTER TABLE planeaciones ADD COLUMN IF NOT EXISTS mes_dosificacion VARCHAR(3) DEFAULT NULL;

-- 2. CREAR ÍNDICES
-- =====================================================

-- Índice para búsquedas por origen
CREATE INDEX IF NOT EXISTS idx_planeaciones_origen ON planeaciones(origen);

-- Índice para búsquedas por mes de dosificación
CREATE INDEX IF NOT EXISTS idx_planeaciones_mes_dosificacion ON planeaciones(mes_dosificacion);

-- Índice para búsquedas por contenidos relacionados
CREATE INDEX IF NOT EXISTS idx_planeaciones_contenidos_relacionados ON planeaciones USING GIN(contenidos_relacionados);

-- 3. ACTUALIZAR COMENTARIOS
-- =====================================================

COMMENT ON COLUMN planeaciones.origen IS 'Origen de la planeación: manual (creada directamente) o dosificacion (generada desde dosificación)';
COMMENT ON COLUMN planeaciones.contenidos_relacionados IS 'Array JSON con los IDs de los contenidos curriculares relacionados con esta planeación';
COMMENT ON COLUMN planeaciones.mes_dosificacion IS 'Mes de dosificación cuando la planeación viene desde dosificación (SEP, OCT, NOV, etc.)';
