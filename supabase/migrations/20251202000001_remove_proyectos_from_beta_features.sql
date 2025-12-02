-- Migración: Eliminar restricción beta de proyectos
-- =====================================================
-- El módulo de proyectos ya no es una funcionalidad beta
-- y está disponible para todos los usuarios activos

-- 1. ELIMINAR ASIGNACIONES DE USUARIOS A LA FUNCIONALIDAD PROYECTOS
-- =====================================================
DELETE FROM user_beta_features
WHERE feature_id IN (
    SELECT id FROM beta_features WHERE feature_key = 'proyectos'
);

-- 2. ELIMINAR LA FUNCIONALIDAD BETA "PROYECTOS"
-- =====================================================
DELETE FROM beta_features
WHERE feature_key = 'proyectos';

-- 3. ACTUALIZAR COMENTARIO DE LA TABLA
-- =====================================================
COMMENT ON TABLE beta_features IS 'Define las funcionalidades beta disponibles en el sistema - Proyectos ya no es beta';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Migración completada: Proyectos removido de funcionalidades beta';
    RAISE NOTICE 'El módulo de proyectos ahora está disponible para todos los usuarios';
END $$;
