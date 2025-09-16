-- Migración: Actualizar funcionalidades beta a solo "Proyectos"
-- =====================================================
-- Esta migración reemplaza todas las funcionalidades beta existentes
-- con una sola funcionalidad: "Proyectos"

-- 1. ELIMINAR ASIGNACIONES EXISTENTES
-- =====================================================
-- Primero eliminamos todas las asignaciones de usuarios a las funcionalidades actuales
DELETE FROM user_beta_features;

-- 2. ELIMINAR FUNCIONALIDADES BETA EXISTENTES
-- =====================================================
-- Eliminamos todas las funcionalidades beta actuales
DELETE FROM beta_features;

-- 3. INSERTAR NUEVA FUNCIONALIDAD BETA: PROYECTOS
-- =====================================================
INSERT INTO beta_features (feature_key, feature_name, description) VALUES
('proyectos', 'Módulo de Proyectos', 'Sistema completo de gestión de proyectos educativos con seguimiento, tareas y colaboración');

-- 4. COMENTARIOS
-- =====================================================
COMMENT ON TABLE beta_features IS 'Define las funcionalidades beta disponibles en el sistema - Actualmente solo Proyectos';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Migración completada: Funcionalidades beta actualizadas a solo "Proyectos"';
END $$;
