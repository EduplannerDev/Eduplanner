-- Migración: Corregir CASCADE en project_creations para mantener límites lifetime
-- =====================================================
-- Esta migración elimina el CASCADE entre project_creations y proyectos
-- para que los registros de creación se mantengan aunque se elimine el proyecto
-- y así preservar los límites lifetime correctamente

-- 1. ELIMINAR LA REFERENCIA CON CASCADE
-- =====================================================

-- Primero, eliminar la constraint existente
ALTER TABLE project_creations 
DROP CONSTRAINT IF EXISTS project_creations_project_id_fkey;

-- 2. RECREAR LA REFERENCIA SIN CASCADE
-- =====================================================

-- Crear nueva constraint sin CASCADE para mantener los registros
ALTER TABLE project_creations 
ADD CONSTRAINT project_creations_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES proyectos(id) ON DELETE SET NULL;

-- 3. COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON CONSTRAINT project_creations_project_id_fkey ON project_creations IS 
'Referencia a proyectos sin CASCADE para mantener registros de creación y límites lifetime.
Si se elimina un proyecto, el project_id se establece como NULL pero el registro se mantiene.';

-- 4. ACTUALIZAR COMENTARIO DE LA TABLA
-- =====================================================
COMMENT ON TABLE project_creations IS 
'Tabla para rastrear creaciones de proyectos y aplicar límites lifetime.
Los registros se mantienen aunque se elimine el proyecto para preservar el conteo de límites.';
