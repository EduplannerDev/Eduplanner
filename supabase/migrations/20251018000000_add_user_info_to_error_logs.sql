-- Migración: Agregar campos de información del usuario a error_logs
-- =====================================================
-- Esta migración agrega campos para capturar información adicional del usuario

-- 1. AGREGAR CAMPOS DE INFORMACIÓN DEL USUARIO
-- =====================================================
ALTER TABLE error_logs 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_role VARCHAR(50);

-- 2. CREAR ÍNDICES PARA LOS NUEVOS CAMPOS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_error_logs_user_email ON error_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_role ON error_logs(user_role);

-- 3. COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON COLUMN error_logs.user_email IS 'Email del usuario que generó el error';
COMMENT ON COLUMN error_logs.user_role IS 'Rol del usuario que generó el error (teacher, director, etc.)';

-- 4. ACTUALIZAR FUNCIÓN DE ESTADÍSTICAS PARA INCLUIR INFORMACIÓN DEL USUARIO
-- =====================================================
-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS get_error_logs_stats(TIMESTAMPTZ, TIMESTAMPTZ);

-- Recrear la función con el nuevo tipo de retorno
CREATE OR REPLACE FUNCTION get_error_logs_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    level VARCHAR(10),
    category VARCHAR(100),
    count BIGINT,
    latest_error TIMESTAMPTZ,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.level,
        el.category,
        COUNT(*) as count,
        MAX(el.created_at) as latest_error,
        COUNT(DISTINCT el.user_id) as unique_users
    FROM error_logs el
    WHERE el.created_at BETWEEN start_date AND end_date
    GROUP BY el.level, el.category
    ORDER BY count DESC, latest_error DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_error_logs_stats(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Obtiene estadísticas de logs de errores por nivel y categoría en un rango de fechas, incluyendo número de usuarios únicos';
