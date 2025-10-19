-- Migración: Actualizar restricción de grado en contexto_trabajo para preescolar
-- =====================================================
-- Esta migración actualiza la restricción de grado para permitir valores negativos
-- para preescolar (-3 a -1) manteniendo compatibilidad con primaria y secundaria

-- Actualizar la restricción de grado para incluir preescolar
ALTER TABLE contexto_trabajo DROP CONSTRAINT IF EXISTS contexto_trabajo_grado_check;
ALTER TABLE contexto_trabajo ADD CONSTRAINT contexto_trabajo_grado_check CHECK (grado >= -3 AND grado <= 12);

-- Actualizar el comentario de la columna grado
COMMENT ON COLUMN contexto_trabajo.grado IS 'Grado escolar: preescolar (-3 a -1), primaria (1-6), secundaria (7-9), bachillerato (10-12)';
