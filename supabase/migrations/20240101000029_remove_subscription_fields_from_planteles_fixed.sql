-- Migración: Eliminar campos de suscripción de planteles (CORREGIDA)
-- =====================================================
-- Esta migración elimina los campos relacionados con tipos de suscripción
-- de la tabla planteles, ya que todos los planteles que pagan tendrán
-- acceso "pro" sin distinción de tipos de suscripción

-- 1. ELIMINAR ÍNDICES RELACIONADOS CON SUSCRIPCIÓN
-- =====================================================
DROP INDEX IF EXISTS idx_planteles_plan_suscripcion;
DROP INDEX IF EXISTS idx_planteles_estado_suscripcion;
DROP INDEX IF EXISTS idx_planteles_fecha_vencimiento;

-- 2. ELIMINAR VISTA QUE DEPENDE DE LAS COLUMNAS A ELIMINAR
-- =====================================================
DROP VIEW IF EXISTS planteles_with_limits;

-- 3. ELIMINAR COLUMNAS DE SUSCRIPCIÓN DE PLANTELES
-- =====================================================

-- Eliminar plan de suscripción del plantel
ALTER TABLE planteles 
DROP COLUMN IF EXISTS plan_suscripcion;

-- Eliminar estado de la suscripción del plantel
ALTER TABLE planteles 
DROP COLUMN IF EXISTS estado_suscripcion;

-- Eliminar fecha de vencimiento de la suscripción
ALTER TABLE planteles 
DROP COLUMN IF EXISTS fecha_vencimiento;

-- Eliminar campo redundante de máximo usuarios (ya tenemos max_profesores y max_directores)
ALTER TABLE planteles 
DROP COLUMN IF EXISTS max_usuarios;

-- 4. RECREAR VISTA PLANTELES_WITH_LIMITS
-- =====================================================
-- Recrear la vista sin los campos de suscripción y max_usuarios
CREATE OR REPLACE VIEW planteles_with_limits AS
SELECT 
    p.*,
    COALESCE(user_counts.total_profesores, 0) as profesores_actuales,
    COALESCE(user_counts.total_directores, 0) as directores_actuales,
    COALESCE(user_counts.total_administradores, 0) as administradores_actuales,
    (p.max_profesores - COALESCE(user_counts.total_profesores, 0)) as profesores_disponibles,
    (p.max_directores - COALESCE(user_counts.total_directores, 0)) as directores_disponibles
FROM planteles p
LEFT JOIN (
    SELECT 
        upa.plantel_id,
        COUNT(CASE WHEN pr.role = 'profesor' THEN 1 END) as total_profesores,
        COUNT(CASE WHEN pr.role = 'director' THEN 1 END) as total_directores,
        COUNT(CASE WHEN pr.role = 'administrador' THEN 1 END) as total_administradores
    FROM user_plantel_assignments upa
    JOIN profiles pr ON upa.user_id = pr.id
    WHERE upa.activo = true
    GROUP BY upa.plantel_id
) user_counts ON p.id = user_counts.plantel_id;

-- 5. COMENTARIOS SOBRE LOS CAMBIOS
-- =====================================================
COMMENT ON TABLE planteles IS 'Tabla de planteles educativos. Los campos de suscripción fueron eliminados ya que todos los planteles que pagan tendrán acceso pro sin distinción de tipos.';

-- 6. ACTUALIZAR FUNCIÓN DE VALIDACIÓN DE LÍMITES (SI EXISTE)
-- =====================================================
-- Actualizar función para validar límites sin considerar suscripción ni max_usuarios
CREATE OR REPLACE FUNCTION public.validate_plantel_user_limits(plantel_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_limit INTEGER;
BEGIN
    -- Obtener el conteo actual según el rol
    IF new_role = 'profesor' THEN
        SELECT COALESCE(profesores_actuales, 0), max_profesores 
        INTO current_count, max_limit
        FROM planteles_with_limits 
        WHERE id = plantel_id;
    ELSIF new_role = 'director' THEN
        SELECT COALESCE(directores_actuales, 0), max_directores 
        INTO current_count, max_limit
        FROM planteles_with_limits 
        WHERE id = plantel_id;
    ELSE
        -- Para otros roles (administrador), no hay límite específico
        RETURN TRUE;
    END IF;
    
    -- Verificar si se puede agregar un usuario más
    RETURN (current_count + 1) <= max_limit;
END;
$$ LANGUAGE plpgsql;