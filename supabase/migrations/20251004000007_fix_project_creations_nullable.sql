-- Migración: Permitir valores NULL en project_id de project_creations
-- =====================================================
-- Esta migración permite que project_id sea NULL cuando se elimina un proyecto
-- para mantener los registros de creación y límites lifetime

-- 1. HACER LA COLUMNA PROJECT_ID NULLABLE
-- =====================================================

-- Cambiar la columna project_id para permitir valores NULL
ALTER TABLE project_creations 
ALTER COLUMN project_id DROP NOT NULL;

-- 2. COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON COLUMN project_creations.project_id IS 
'ID del proyecto. Puede ser NULL si el proyecto fue eliminado pero se mantiene el registro para límites lifetime.';
