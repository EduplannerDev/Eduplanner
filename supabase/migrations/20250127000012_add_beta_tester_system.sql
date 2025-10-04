-- Migración: Sistema de Beta Testers y Feature Flags
-- =====================================================
-- Esta migración implementa un sistema completo de beta testers
-- que permite activar funcionalidades específicas para usuarios seleccionados

-- 1. AGREGAR CAMPO BETA TESTER A PROFILES
-- =====================================================
-- Agregar campo para identificar usuarios beta testers
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT false;

-- Crear índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_profiles_is_beta_tester ON profiles(is_beta_tester);

-- Comentario para la nueva columna
COMMENT ON COLUMN profiles.is_beta_tester IS 'Indica si el usuario es un beta tester con acceso a funcionalidades experimentales';

-- 2. CREAR TABLA BETA FEATURES
-- =====================================================
-- Tabla para definir las funcionalidades beta disponibles
CREATE TABLE IF NOT EXISTS beta_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para beta_features
CREATE INDEX IF NOT EXISTS idx_beta_features_key ON beta_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_beta_features_active ON beta_features(is_active);

-- Comentarios para beta_features
COMMENT ON TABLE beta_features IS 'Define las funcionalidades beta disponibles en el sistema';
COMMENT ON COLUMN beta_features.feature_key IS 'Clave única para identificar la funcionalidad (ej: "ai_assistant", "advanced_analytics")';
COMMENT ON COLUMN beta_features.feature_name IS 'Nombre descriptivo de la funcionalidad';
COMMENT ON COLUMN beta_features.description IS 'Descripción detallada de la funcionalidad';
COMMENT ON COLUMN beta_features.is_active IS 'Indica si la funcionalidad está activa y disponible';

-- 3. CREAR TABLA USER BETA FEATURES
-- =====================================================
-- Tabla para asignar funcionalidades beta específicas a usuarios
CREATE TABLE IF NOT EXISTS user_beta_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES beta_features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT unique_user_feature UNIQUE(user_id, feature_id)
);

-- Índices para user_beta_features
CREATE INDEX IF NOT EXISTS idx_user_beta_features_user_id ON user_beta_features(user_id);
CREATE INDEX IF NOT EXISTS idx_user_beta_features_feature_id ON user_beta_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_user_beta_features_enabled ON user_beta_features(is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_beta_features_expires ON user_beta_features(expires_at);

-- Comentarios para user_beta_features
COMMENT ON TABLE user_beta_features IS 'Asigna funcionalidades beta específicas a usuarios';
COMMENT ON COLUMN user_beta_features.user_id IS 'ID del usuario que tiene acceso a la funcionalidad';
COMMENT ON COLUMN user_beta_features.feature_id IS 'ID de la funcionalidad beta';
COMMENT ON COLUMN user_beta_features.is_enabled IS 'Indica si el acceso está activo';
COMMENT ON COLUMN user_beta_features.granted_by IS 'ID del administrador que otorgó el acceso';
COMMENT ON COLUMN user_beta_features.expires_at IS 'Fecha de expiración del acceso (opcional)';

-- 4. CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================
-- Trigger para beta_features
CREATE TRIGGER update_beta_features_updated_at
    BEFORE UPDATE ON beta_features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para user_beta_features
CREATE TRIGGER update_user_beta_features_updated_at
    BEFORE UPDATE ON user_beta_features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. INSERTAR FUNCIONALIDADES BETA INICIALES
-- =====================================================
-- Insertar algunas funcionalidades beta de ejemplo
INSERT INTO beta_features (feature_key, feature_name, description) VALUES
('ai_assistant', 'Asistente de IA Avanzado', 'Funcionalidades avanzadas de IA para planeación y análisis'),
('advanced_analytics', 'Analíticas Avanzadas', 'Dashboard con métricas detalladas y reportes avanzados'),
('bulk_operations', 'Operaciones Masivas', 'Herramientas para realizar operaciones en lote'),
('custom_templates', 'Plantillas Personalizadas', 'Creación y gestión de plantillas personalizadas'),
('api_access', 'Acceso a API', 'Acceso a endpoints de API para integraciones externas')
ON CONFLICT (feature_key) DO NOTHING;

-- 6. CREAR FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para verificar si un usuario es beta tester
CREATE OR REPLACE FUNCTION is_beta_tester(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id 
        AND is_beta_tester = true 
        AND activo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario tiene acceso a una funcionalidad beta específica
CREATE OR REPLACE FUNCTION has_beta_feature_access(
    p_feature_key VARCHAR(100),
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    user_is_beta BOOLEAN;
    feature_exists BOOLEAN;
    has_access BOOLEAN;
BEGIN
    -- Verificar si el usuario es beta tester
    SELECT is_beta_tester(p_user_id) INTO user_is_beta;
    
    IF NOT user_is_beta THEN
        RETURN false;
    END IF;
    
    -- Verificar si la funcionalidad existe y está activa
    SELECT EXISTS (
        SELECT 1 FROM beta_features 
        WHERE feature_key = p_feature_key 
        AND is_active = true
    ) INTO feature_exists;
    
    IF NOT feature_exists THEN
        RETURN false;
    END IF;
    
    -- Verificar si el usuario tiene acceso específico a la funcionalidad
    SELECT EXISTS (
        SELECT 1 FROM user_beta_features ubf
        JOIN beta_features bf ON ubf.feature_id = bf.id
        WHERE ubf.user_id = p_user_id 
        AND bf.feature_key = p_feature_key
        AND ubf.is_enabled = true
        AND (ubf.expires_at IS NULL OR ubf.expires_at > NOW())
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener todas las funcionalidades beta de un usuario
CREATE OR REPLACE FUNCTION get_user_beta_features(p_user_id UUID)
RETURNS TABLE (
    feature_key VARCHAR(100),
    feature_name VARCHAR(255),
    description TEXT,
    granted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Primero, verificar si el usuario es beta tester
    IF NOT is_beta_tester(p_user_id) THEN
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

-- 7. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE beta_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_beta_features ENABLE ROW LEVEL SECURITY;

-- Políticas para beta_features (todos pueden ver las funcionalidades activas)
CREATE POLICY "Anyone can view active beta features" ON beta_features
    FOR SELECT USING (is_active = true);

-- Políticas para user_beta_features (usuarios solo pueden ver sus propias asignaciones)
CREATE POLICY "Users can view own beta features" ON user_beta_features
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para administradores (pueden gestionar todo)
CREATE POLICY "Admins can manage beta features" ON beta_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador' 
            AND activo = true
        )
    );

CREATE POLICY "Admins can manage user beta features" ON user_beta_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador' 
            AND activo = true
        )
    );

-- 8. ACTUALIZAR USUARIOS EXISTENTES
-- =====================================================
-- Asegurar que todos los usuarios existentes tengan is_beta_tester = false
UPDATE profiles 
SET is_beta_tester = false 
WHERE is_beta_tester IS NULL;

-- 9. COMENTARIOS FINALES
-- =====================================================
COMMENT ON FUNCTION is_beta_tester(UUID) IS 'Verifica si un usuario es beta tester';
COMMENT ON FUNCTION has_beta_feature_access(VARCHAR, UUID) IS 'Verifica si un usuario tiene acceso a una funcionalidad beta específica';
COMMENT ON FUNCTION get_user_beta_features(UUID) IS 'Obtiene todas las funcionalidades beta disponibles para un usuario';

-- Mensaje de finalización                                                                                                              
DO $$                                                                                                                                   
BEGIN                                                                                                                                   
    RAISE NOTICE 'Migración de sistema de beta testers completada exitosamente';
    RAISE NOTICE 'Se agregaron % funcionalidades beta iniciales', (SELECT COUNT(*) FROM beta_features);
END $$;
