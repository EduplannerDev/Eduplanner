-- Migración: Agregar columna numero_alumnos a tabla grupos
-- =====================================================
-- Esta migración agrega la columna numero_alumnos que es requerida
-- por el trigger update_grupo_numero_alumnos

-- 1. AGREGAR COLUMNA NUMERO_ALUMNOS
-- =====================================================
ALTER TABLE grupos 
ADD COLUMN IF NOT EXISTS numero_alumnos INTEGER DEFAULT 0;

-- 2. CREAR ÍNDICE PARA LA NUEVA COLUMNA
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_grupos_numero_alumnos ON grupos(numero_alumnos);

-- 3. COMENTARIO PARA LA NUEVA COLUMNA
-- =====================================================
COMMENT ON COLUMN grupos.numero_alumnos IS 'Número total de alumnos en el grupo (actualizado automáticamente por trigger)';

-- 4. ACTUALIZAR VALORES EXISTENTES
-- =====================================================
-- Actualizar el contador para grupos existentes
UPDATE grupos 
SET numero_alumnos = (
    SELECT COUNT(*) 
    FROM alumnos 
    WHERE alumnos.grupo_id = grupos.id
)
WHERE numero_alumnos IS NULL OR numero_alumnos = 0;

-- 5. AGREGAR CONSTRAINT PARA VALIDAR VALORES
-- =====================================================
ALTER TABLE grupos 
ADD CONSTRAINT check_numero_alumnos_non_negative 
CHECK (numero_alumnos >= 0);