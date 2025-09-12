-- Migración: Corregir tipo de datos de contenido_id en dosificacion_meses
-- =====================================================
-- Esta migración corrige el tipo de datos de contenido_id de INTEGER a UUID
-- para que sea compatible con la tabla curriculo_sep

-- 1. ELIMINAR CONSTRAINT Y COLUMNA ACTUAL
-- =====================================================

-- Eliminar el constraint de unicidad que incluye contenido_id
ALTER TABLE dosificacion_meses DROP CONSTRAINT IF EXISTS unique_profesor_contexto_contenido_mes;

-- Eliminar la columna contenido_id actual
ALTER TABLE dosificacion_meses DROP COLUMN IF EXISTS contenido_id;

-- 2. AGREGAR NUEVA COLUMNA CON TIPO CORRECTO
-- =====================================================

-- Agregar la columna contenido_id como UUID (permitir NULL inicialmente)
ALTER TABLE dosificacion_meses ADD COLUMN contenido_id UUID REFERENCES curriculo_sep(id) ON DELETE CASCADE;

-- 3. LIMPIAR DATOS EXISTENTES (si los hay)
-- =====================================================

-- Eliminar registros existentes que no tienen contenido_id válido
-- ya que no podemos mapear INTEGER a UUID sin información adicional
DELETE FROM dosificacion_meses WHERE contenido_id IS NULL;

-- 4. HACER LA COLUMNA NOT NULL
-- =====================================================

-- Ahora que no hay valores NULL, hacer la columna NOT NULL
ALTER TABLE dosificacion_meses ALTER COLUMN contenido_id SET NOT NULL;

-- 5. RECREAR CONSTRAINT DE UNICIDAD
-- =====================================================

-- Recrear el constraint de unicidad con el tipo correcto
ALTER TABLE dosificacion_meses ADD CONSTRAINT unique_profesor_contexto_contenido_mes 
UNIQUE(profesor_id, contexto_id, contenido_id, mes);

-- 6. ACTUALIZAR COMENTARIOS
-- =====================================================

COMMENT ON COLUMN dosificacion_meses.contenido_id IS 'ID del contenido curricular (UUID que referencia a curriculo_sep.id)';
