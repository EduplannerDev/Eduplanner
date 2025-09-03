-- Migración: Eliminar campo grupo_id de parent_messages
-- =====================================================
-- Esta migración elimina el campo grupo_id que ya no es necesario
-- ya que se puede obtener a través de alumnos.grupo_id

-- PASO 1: ELIMINAR EL CAMPO GRUPO_ID
-- =====================================================
ALTER TABLE parent_messages DROP COLUMN IF EXISTS grupo_id;

-- PASO 2: COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON TABLE parent_messages IS 'Tabla para mensajes dirigidos a padres de familia - campo grupo_id eliminado, se obtiene a través de alumnos.grupo_id';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Campo grupo_id eliminado de parent_messages exitosamente';
END $$;