-- Migración: Actualizar límite de exámenes de 3 a 2 para usuarios free
-- =====================================================
-- Esta migración actualiza la función get_user_limits para cambiar
-- el límite de exámenes de usuarios gratuitos de 3 a 2

-- 1. ACTUALIZAR FUNCIÓN PARA OBTENER LÍMITES DE USUARIO
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_limits(user_id UUID)
RETURNS TABLE(
    planeaciones_limit INTEGER,
    examenes_limit INTEGER,
    mensajes_limit INTEGER
) AS $$
DECLARE
    is_pro BOOLEAN;
BEGIN
    SELECT public.is_user_pro(user_id) INTO is_pro;
    
    IF is_pro THEN
        -- Límites para usuarios pro (ilimitado = -1)
        RETURN QUERY SELECT -1, -1, -1;
    ELSE
        -- Límites para usuarios free (actualizado: exámenes de 3 a 2)
        RETURN QUERY SELECT 5, 2, 10;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. COMENTARIO DE LA MIGRACIÓN
-- =====================================================
COMMENT ON FUNCTION public.get_user_limits(UUID) IS 'Función actualizada: límite de exámenes cambiado de 3 a 2 para usuarios free';
