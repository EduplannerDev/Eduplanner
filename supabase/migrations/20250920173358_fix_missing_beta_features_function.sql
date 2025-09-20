-- Migración: Arreglar función get_user_beta_features faltante
-- =====================================================
-- Esta migración elimina la función existente y crea la correcta

-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS get_user_beta_features(UUID);

-- Crear la función get_user_beta_features con el nombre de parámetro correcto
CREATE OR REPLACE FUNCTION get_user_beta_features(p_user_id UUID)
RETURNS TABLE (
    feature_key VARCHAR(100),
    feature_name VARCHAR(255),
    description TEXT,
    granted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Verificar si el usuario es beta tester
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id 
        AND is_beta_tester = true 
        AND activo = true
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        bf.feature_key,
        bf.feature_name,
        bf.description,
        ubf.granted_at,
        ubf.expires_at
    FROM user_beta_features ubf
    JOIN beta_features bf ON ubf.feature_id = bf.id
    WHERE ubf.user_id = p_user_id 
    AND ubf.is_enabled = true
    AND bf.is_active = true
    AND (ubf.expires_at IS NULL OR ubf.expires_at > NOW())
    ORDER BY bf.feature_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario
COMMENT ON FUNCTION get_user_beta_features(UUID) IS 'Obtiene todas las funcionalidades beta disponibles para un usuario';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Función get_user_beta_features recreada exitosamente';
END $$;