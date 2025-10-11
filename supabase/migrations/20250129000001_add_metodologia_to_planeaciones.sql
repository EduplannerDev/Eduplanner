-- Migración: Agregar columna metodologia a la tabla planeaciones
-- =====================================================
-- Esta migración agrega una nueva columna 'metodologia' a la tabla planeaciones
-- con valor por defecto 'NEM' sin perder ningún dato existente

-- 1. AGREGAR COLUMNA METODOLOGIA
-- =====================================================

ALTER TABLE planeaciones 
ADD COLUMN IF NOT EXISTS metodologia VARCHAR(50) DEFAULT 'NEM';

-- 2. ACTUALIZAR REGISTROS EXISTENTES
-- =====================================================
-- Asegurar que todos los registros existentes tengan el valor por defecto

UPDATE planeaciones 
SET metodologia = 'NEM' 
WHERE metodologia IS NULL;

-- 3. HACER LA COLUMNA NOT NULL
-- =====================================================
-- Una vez que todos los registros tienen el valor, hacer la columna NOT NULL

ALTER TABLE planeaciones 
ALTER COLUMN metodologia SET NOT NULL;

-- 4. AGREGAR CHECK CONSTRAINT
-- =====================================================
-- Asegurar que solo se permitan metodologías válidas

ALTER TABLE planeaciones 
ADD CONSTRAINT check_metodologia_valid 
CHECK (metodologia IN ('NEM', 'CIME', 'TRADICIONAL', 'PROYECTOS'));

-- 5. COMENTARIOS
-- =====================================================

COMMENT ON COLUMN planeaciones.metodologia IS 'Metodología utilizada para crear la planeación (NEM, CIME, TRADICIONAL, PROYECTOS)';

-- 6. ÍNDICE PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_planeaciones_metodologia ON planeaciones(metodologia);

-- 7. ACTUALIZAR FUNCIONES EXISTENTES (si es necesario)
-- =====================================================
-- Si hay funciones que insertan en planeaciones, podrían necesitar actualización
-- pero como agregamos un valor por defecto, debería funcionar automáticamente

-- 8. VERIFICACIÓN
-- =====================================================
-- Verificar que todos los registros tengan la metodología asignada

DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM planeaciones 
    WHERE metodologia IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Aún existen % registros con metodologia NULL', null_count;
    ELSE
        RAISE NOTICE 'Migración completada exitosamente. Todos los registros tienen metodología asignada.';
    END IF;
END $$;
