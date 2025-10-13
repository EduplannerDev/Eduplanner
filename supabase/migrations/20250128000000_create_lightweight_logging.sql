-- Migración: Sistema de logging ultra-optimizado
-- ==============================================
-- Tabla minimalista para máximo rendimiento

-- 1. TABLA PRINCIPAL LIGERA
-- ==========================
CREATE TABLE IF NOT EXISTS system_logs_lightweight (
    id BIGSERIAL PRIMARY KEY, -- Usar BIGSERIAL para mejor rendimiento
    level VARCHAR(10) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    context JSONB, -- Solo para datos críticos
    session_id VARCHAR(100),
    user_id UUID, -- Sin foreign key para mejor rendimiento
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÍNDICES OPTIMIZADOS
-- =======================
-- Índice compuesto para consultas más comunes
CREATE INDEX IF NOT EXISTS idx_logs_level_category_created 
ON system_logs_lightweight(level, category, created_at DESC);

-- Índice para consultas por usuario (solo errores)
CREATE INDEX IF NOT EXISTS idx_logs_user_errors 
ON system_logs_lightweight(user_id, created_at DESC) 
WHERE level IN ('ERROR', 'FATAL');

-- Índice para limpieza automática
CREATE INDEX IF NOT EXISTS idx_logs_created_at 
ON system_logs_lightweight(created_at);

-- 3. TABLA DE ERRORES CRÍTICOS (separada para mejor rendimiento)
-- ===============================================================
CREATE TABLE IF NOT EXISTS critical_errors (
    id BIGSERIAL PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID,
    session_id VARCHAR(100),
    context JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para errores no resueltos
CREATE INDEX IF NOT EXISTS idx_critical_errors_unresolved 
ON critical_errors(created_at DESC) 
WHERE resolved = FALSE;

-- 4. TABLA DE MÉTRICAS SIMPLES (para analytics básicos)
-- =====================================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    user_id UUID,
    session_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para métricas recientes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recent 
ON performance_metrics(metric_name, created_at DESC);

-- 5. POLÍTICAS RLS SIMPLIFICADAS
-- ===============================
ALTER TABLE system_logs_lightweight ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Solo administradores pueden ver logs
CREATE POLICY "Admins can view all logs" ON system_logs_lightweight
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'administrador'
    )
);

CREATE POLICY "Admins can view critical errors" ON critical_errors
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'administrador'
    )
);

CREATE POLICY "Admins can view performance metrics" ON performance_metrics
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'administrador'
    )
);

-- 6. FUNCIÓN DE LIMPIEZA AUTOMÁTICA
-- ==================================
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Eliminar logs antiguos (más de 30 días)
    DELETE FROM system_logs_lightweight 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Eliminar métricas antiguas (más de 7 días)
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Eliminar errores críticos resueltos antiguos (más de 14 días)
    DELETE FROM critical_errors 
    WHERE resolved = TRUE 
    AND resolved_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER PARA ERRORES CRÍTICOS AUTOMÁTICOS
-- ============================================
CREATE OR REPLACE FUNCTION log_critical_error()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo insertar errores críticos en tabla separada
    IF NEW.level IN ('ERROR', 'FATAL') THEN
        INSERT INTO critical_errors (
            error_type,
            error_message,
            user_id,
            session_id,
            context,
            created_at
        ) VALUES (
            NEW.category,
            NEW.message,
            NEW.user_id,
            NEW.session_id,
            NEW.context,
            NEW.created_at
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_log_critical_error ON system_logs_lightweight;
CREATE TRIGGER trigger_log_critical_error
    AFTER INSERT ON system_logs_lightweight
    FOR EACH ROW
    EXECUTE FUNCTION log_critical_error();

-- 8. COMENTARIOS PARA DOCUMENTACIÓN
-- ==================================
COMMENT ON TABLE system_logs_lightweight IS 'Logs del sistema optimizados para rendimiento';
COMMENT ON COLUMN system_logs_lightweight.id IS 'ID secuencial para mejor rendimiento';
COMMENT ON COLUMN system_logs_lightweight.context IS 'Contexto JSON solo para datos críticos';
COMMENT ON TABLE critical_errors IS 'Errores críticos separados para alertas rápidas';
COMMENT ON TABLE performance_metrics IS 'Métricas de rendimiento simples';
