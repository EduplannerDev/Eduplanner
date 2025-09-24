-- Migración: Corrección final de la vista planteles_with_limits
-- Eliminar completamente cualquier referencia a max_usuarios
-- Fecha: 2024-01-01
-- Descripción: Asegurar que la vista planteles_with_limits no tenga referencias a max_usuarios

-- 1. ELIMINAR VISTA EXISTENTE
-- =====================================================
DROP VIEW IF EXISTS public.planteles_with_limits CASCADE;

-- 2. RECREAR VISTA SIN MAX_USUARIOS
-- =====================================================
CREATE VIEW public.planteles_with_limits AS
SELECT 
    p.id,
    p.nombre,
    p.direccion,
    p.telefono,
    p.email,
    p.nivel_educativo,
    p.activo,
    p.created_at,
    p.updated_at,
    p.max_profesores,
    p.max_directores,
    COALESCE(user_counts.total_profesores, 0) as profesores_actuales,
    COALESCE(user_counts.total_directores, 0) as directores_actuales,
    COALESCE(user_counts.total_administradores, 0) as administradores_actuales,
    GREATEST(0, COALESCE(p.max_profesores, 0) - COALESCE(user_counts.total_profesores, 0)) as profesores_disponibles,
    GREATEST(0, COALESCE(p.max_directores, 0) - COALESCE(user_counts.total_directores, 0)) as directores_disponibles
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

-- 3. PERMISOS Y PROPIETARIO
-- =====================================================
ALTER VIEW public.planteles_with_limits OWNER TO postgres;
GRANT SELECT ON public.planteles_with_limits TO authenticated;
GRANT SELECT ON public.planteles_with_limits TO service_role;

-- 4. COMENTARIO
-- =====================================================
COMMENT ON VIEW public.planteles_with_limits IS 'Vista que combina información de planteles con conteos actuales de usuarios por rol. Eliminadas todas las referencias a max_usuarios y campos de suscripción.';

-- 5. ACTUALIZAR FUNCIÓN DE VALIDACIÓN
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_plantel_user_limits(plantel_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_limit INTEGER;
BEGIN
    -- Obtener el conteo actual según el rol
    IF new_role = 'profesor' THEN
        SELECT COALESCE(profesores_actuales, 0), COALESCE(max_profesores, 0)
        INTO current_count, max_limit
        FROM planteles_with_limits 
        WHERE id = plantel_id;
    ELSIF new_role = 'director' THEN
        SELECT COALESCE(directores_actuales, 0), COALESCE(max_directores, 0)
        INTO current_count, max_limit
        FROM planteles_with_limits 
        WHERE id = plantel_id;
    ELSIF new_role = 'administrador' THEN
        -- Los administradores no tienen límite específico por plantel
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
    
    -- Verificar si se puede agregar el usuario
    RETURN current_count < max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. MENSAJE DE CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Vista planteles_with_limits recreada sin referencias a max_usuarios';
END $$;