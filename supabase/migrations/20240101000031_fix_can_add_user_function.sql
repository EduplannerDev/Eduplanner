-- Migración: Actualizar función can_add_user_to_plantel
-- Eliminar referencias a max_usuarios y estado_suscripcion
-- Fecha: 2024-01-01
-- Descripción: Actualizar la función para trabajar solo con max_profesores y max_directores

-- 1. ACTUALIZAR FUNCIÓN can_add_user_to_plantel
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_add_user_to_plantel(
    plantel_id UUID, 
    user_role user_role
)
RETURNS BOOLEAN AS $$
DECLARE
    current_counts RECORD;
    plantel_limits RECORD;
BEGIN
    -- Obtener límites del plantel (sin max_usuarios ni estado_suscripcion)
    SELECT max_profesores, max_directores, activo
    INTO plantel_limits
    FROM planteles 
    WHERE id = plantel_id;
    
    -- Verificar que el plantel existe y está activo
    IF plantel_limits IS NULL OR plantel_limits.activo != true THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener conteos actuales
    SELECT * INTO current_counts
    FROM public.get_plantel_user_count(plantel_id);
    
    -- Verificar límites específicos por rol
    CASE user_role
        WHEN 'profesor' THEN
            IF current_counts.total_profesores >= COALESCE(plantel_limits.max_profesores, 0) THEN
                RETURN FALSE;
            END IF;
        WHEN 'director' THEN
            IF current_counts.total_directores >= COALESCE(plantel_limits.max_directores, 0) THEN
                RETURN FALSE;
            END IF;
        WHEN 'administrador' THEN
            -- Los administradores no tienen límite específico por plantel
            RETURN TRUE;
        ELSE
            RETURN FALSE;
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ACTUALIZAR FUNCIÓN get_plantel_user_count SI ES NECESARIO
-- =====================================================
-- Verificar si la función get_plantel_user_count también necesita actualización
CREATE OR REPLACE FUNCTION public.get_plantel_user_count(plantel_id UUID)
RETURNS TABLE(
    total_usuarios INTEGER,
    total_profesores INTEGER,
    total_directores INTEGER,
    total_administradores INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_usuarios,
        COUNT(CASE WHEN pr.role = 'profesor' THEN 1 END)::INTEGER as total_profesores,
        COUNT(CASE WHEN pr.role = 'director' THEN 1 END)::INTEGER as total_directores,
        COUNT(CASE WHEN pr.role = 'administrador' THEN 1 END)::INTEGER as total_administradores
    FROM user_plantel_assignments upa
    JOIN profiles pr ON upa.user_id = pr.id
    WHERE upa.plantel_id = get_plantel_user_count.plantel_id 
    AND upa.activo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION public.can_add_user_to_plantel(UUID, user_role) IS 'Función que verifica si se puede agregar un usuario a un plantel basado en los límites de profesores y directores. Eliminadas referencias a max_usuarios y estado_suscripcion.';

COMMENT ON FUNCTION public.get_plantel_user_count(UUID) IS 'Función que obtiene el conteo actual de usuarios por rol en un plantel específico.';

-- 4. MENSAJE DE CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Función can_add_user_to_plantel actualizada sin referencias a max_usuarios';
    RAISE NOTICE 'Función get_plantel_user_count actualizada para consistencia';
END $$;