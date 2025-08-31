-- Migración: Agregar columnas faltantes a tabla grupos
-- =====================================================
-- Esta migración agrega las columnas nivel y grupo a la tabla grupos
-- para clasificar los grupos por nivel educativo y sección

-- 1. AGREGAR COLUMNAS FALTANTES A GRUPOS
-- =====================================================
ALTER TABLE grupos 
ADD COLUMN IF NOT EXISTS nivel VARCHAR(50);

ALTER TABLE grupos 
ADD COLUMN IF NOT EXISTS grupo VARCHAR(10);

-- 2. CREAR ÍNDICES PARA NUEVAS COLUMNAS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_grupos_nivel ON grupos(nivel);
CREATE INDEX IF NOT EXISTS idx_grupos_grupo ON grupos(grupo);

-- 3. COMENTARIOS PARA LAS NUEVAS COLUMNAS
-- =====================================================
COMMENT ON COLUMN grupos.nivel IS 'Nivel educativo del grupo (Preescolar, Primaria, Secundaria, Preparatoria, etc.)';
COMMENT ON COLUMN grupos.grupo IS 'Grupo o sección (A, B, C, etc.)';

-- 4. ACTUALIZAR GRUPOS EXISTENTES (OPCIONAL)
-- =====================================================
-- Si se desea asignar un nivel por defecto a grupos existentes
-- UPDATE grupos SET nivel = 'Primaria' WHERE nivel IS NULL;