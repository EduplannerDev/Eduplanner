-- Migración: Crear tabla error_logs para sistema de logging de errores
-- =====================================================
-- Esta migración crea la tabla para almacenar logs de errores del sistema

-- 1. CREAR TABLA ERROR_LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    category VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    timestamp TIMESTAMPTZ NOT NULL,
    session_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Campos adicionales para mejor debugging
    module VARCHAR(100),
    component VARCHAR(100),
    action VARCHAR(100),
    error_type VARCHAR(50),
    stack_trace TEXT,
    url TEXT,
    user_agent TEXT
);

-- 2. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_module ON error_logs(module);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- Índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_error_logs_level_category_timestamp ON error_logs(level, category, timestamp DESC);

-- Índice GIN para búsquedas en contexto JSON
CREATE INDEX IF NOT EXISTS idx_error_logs_context ON error_logs USING GIN(context);

-- 3. HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios logs
CREATE POLICY "Users can view their own error logs" ON error_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los administradores vean todos los logs
CREATE POLICY "Admins can view all error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'administrador'
        )
    );

-- Política para insertar logs (cualquier usuario autenticado puede insertar)
CREATE POLICY "Authenticated users can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON TABLE error_logs IS 'Tabla para almacenar logs de errores del sistema con contexto detallado';
COMMENT ON COLUMN error_logs.level IS 'Nivel del log: DEBUG, INFO, WARN, ERROR, FATAL';
COMMENT ON COLUMN error_logs.category IS 'Categoría del log (ej: auth, network, react, etc.)';
COMMENT ON COLUMN error_logs.message IS 'Mensaje principal del error';
COMMENT ON COLUMN error_logs.context IS 'Contexto adicional en formato JSON';
COMMENT ON COLUMN error_logs.timestamp IS 'Timestamp del evento que generó el log';
COMMENT ON COLUMN error_logs.session_id IS 'ID de la sesión del usuario';
COMMENT ON COLUMN error_logs.user_id IS 'ID del usuario que generó el error (opcional)';
COMMENT ON COLUMN error_logs.module IS 'Módulo del sistema donde ocurrió el error';
COMMENT ON COLUMN error_logs.component IS 'Componente React donde ocurrió el error';
COMMENT ON COLUMN error_logs.action IS 'Acción que estaba ejecutando el usuario';
COMMENT ON COLUMN error_logs.error_type IS 'Tipo de error (javascript, react, dom, auth, network)';
COMMENT ON COLUMN error_logs.stack_trace IS 'Stack trace completo del error';
COMMENT ON COLUMN error_logs.url IS 'URL donde ocurrió el error';
COMMENT ON COLUMN error_logs.user_agent IS 'User agent del navegador';

-- 5. FUNCIÓN PARA LIMPIAR LOGS ANTIGUOS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
    -- Eliminar logs de DEBUG e INFO más antiguos de 7 días
    DELETE FROM error_logs 
    WHERE level IN ('DEBUG', 'INFO') 
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Eliminar logs de WARN más antiguos de 30 días
    DELETE FROM error_logs 
    WHERE level = 'WARN' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Mantener logs de ERROR y FATAL por 90 días
    DELETE FROM error_logs 
    WHERE level IN ('ERROR', 'FATAL') 
    AND created_at < NOW() - INTERVAL '90 days';
    
    RAISE NOTICE 'Limpieza de logs antiguos completada';
END;
$$ LANGUAGE plpgsql;

-- 6. CREAR TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE TRIGGER update_error_logs_updated_at
    BEFORE UPDATE ON error_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE ERRORES
-- =====================================================
CREATE OR REPLACE FUNCTION get_error_logs_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    level VARCHAR(10),
    category VARCHAR(100),
    count BIGINT,
    latest_error TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.level,
        el.category,
        COUNT(*) as count,
        MAX(el.created_at) as latest_error
    FROM error_logs el
    WHERE el.created_at BETWEEN start_date AND end_date
    GROUP BY el.level, el.category
    ORDER BY count DESC, latest_error DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_error_logs_stats(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Obtiene estadísticas de logs de errores por nivel y categoría en un rango de fechas';
