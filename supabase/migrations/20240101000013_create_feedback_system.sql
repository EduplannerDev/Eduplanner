-- Migración: Crear sistema de feedback
-- =====================================================
-- Esta migración crea las tablas para el sistema de feedback:
-- feedback (feedback general del sistema) y quality_feedback (feedback de calidad de planeaciones)

-- 1. TABLA FEEDBACK
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para feedback
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_email ON feedback(email);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_text_search ON feedback USING gin(to_tsvector('spanish', text));

-- Trigger para updated_at en feedback
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLA QUALITY_FEEDBACK
-- =====================================================
CREATE TABLE IF NOT EXISTS quality_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    planeacion_content TEXT NOT NULL,
    quality_rating VARCHAR(50) NOT NULL CHECK (quality_rating IN ('useful', 'needs_improvement')),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para quality_feedback
CREATE INDEX IF NOT EXISTS idx_quality_feedback_user_id ON quality_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_quality_feedback_rating ON quality_feedback(quality_rating);
CREATE INDEX IF NOT EXISTS idx_quality_feedback_created_at ON quality_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_feedback_content_search ON quality_feedback USING gin(to_tsvector('spanish', planeacion_content));
CREATE INDEX IF NOT EXISTS idx_quality_feedback_text_search ON quality_feedback USING gin(to_tsvector('spanish', feedback_text));

-- Trigger para updated_at en quality_feedback
CREATE TRIGGER update_quality_feedback_updated_at
    BEFORE UPDATE ON quality_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. TABLA FEEDBACK_CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Color hex para UI
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para feedback_categories
CREATE INDEX IF NOT EXISTS idx_feedback_categories_name ON feedback_categories(name);
CREATE INDEX IF NOT EXISTS idx_feedback_categories_active ON feedback_categories(is_active);

-- Trigger para updated_at en feedback_categories
CREATE TRIGGER update_feedback_categories_updated_at
    BEFORE UPDATE ON feedback_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE feedback IS 'Tabla para feedback general del sistema';
COMMENT ON COLUMN feedback.text IS 'Contenido del feedback';
COMMENT ON COLUMN feedback.type IS 'Tipo de feedback (bug, suggestion, feature_request, etc.)';
COMMENT ON COLUMN feedback.email IS 'Email del usuario que envía el feedback (opcional)';
COMMENT ON COLUMN feedback.image_url IS 'URL de imagen adjunta al feedback (opcional)';

COMMENT ON TABLE quality_feedback IS 'Tabla para feedback de calidad de planeaciones generadas por IA';
COMMENT ON COLUMN quality_feedback.user_id IS 'ID del usuario que proporciona el feedback';
COMMENT ON COLUMN quality_feedback.planeacion_content IS 'Contenido de la planeación evaluada';
COMMENT ON COLUMN quality_feedback.quality_rating IS 'Calificación de calidad: useful o needs_improvement';
COMMENT ON COLUMN quality_feedback.feedback_text IS 'Comentarios adicionales del usuario (opcional)';

COMMENT ON TABLE feedback_categories IS 'Categorías para clasificar el feedback';
COMMENT ON COLUMN feedback_categories.color IS 'Color hex para mostrar en la interfaz';

-- 5. POLÍTICAS RLS PARA FEEDBACK
-- =====================================================
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Política para ver feedback (solo administradores)
CREATE POLICY "Solo administradores pueden ver feedback" ON feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para crear feedback (cualquier usuario autenticado o anónimo)
CREATE POLICY "Cualquiera puede crear feedback" ON feedback
    FOR INSERT WITH CHECK (true);

-- Política para actualizar feedback (solo administradores)
CREATE POLICY "Solo administradores pueden actualizar feedback" ON feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar feedback (solo administradores)
CREATE POLICY "Solo administradores pueden eliminar feedback" ON feedback
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 6. POLÍTICAS RLS PARA QUALITY_FEEDBACK
-- =====================================================
ALTER TABLE quality_feedback ENABLE ROW LEVEL SECURITY;

-- Política para ver quality_feedback
CREATE POLICY "Ver quality_feedback según permisos" ON quality_feedback
    FOR SELECT USING (
        user_id = auth.uid() -- Usuario propietario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para crear quality_feedback
CREATE POLICY "Usuarios autenticados pueden crear quality_feedback" ON quality_feedback
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
    );

-- Política para actualizar quality_feedback
CREATE POLICY "Usuarios pueden actualizar su quality_feedback" ON quality_feedback
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar quality_feedback
CREATE POLICY "Usuarios pueden eliminar su quality_feedback" ON quality_feedback
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 7. POLÍTICAS RLS PARA FEEDBACK_CATEGORIES
-- =====================================================
ALTER TABLE feedback_categories ENABLE ROW LEVEL SECURITY;

-- Política para ver categorías (todos pueden ver)
CREATE POLICY "Todos pueden ver categorías de feedback" ON feedback_categories
    FOR SELECT USING (is_active = true);

-- Política para gestionar categorías (solo administradores)
CREATE POLICY "Solo administradores pueden gestionar categorías" ON feedback_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 8. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener estadísticas de feedback
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE(
    total_feedback BIGINT,
    feedback_mes BIGINT,
    por_tipo JSONB,
    total_quality_feedback BIGINT,
    quality_useful BIGINT,
    quality_needs_improvement BIGINT,
    promedio_calidad NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH feedback_stats AS (
        SELECT 
            COUNT(*) as total_fb,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as fb_mes,
            jsonb_object_agg(type, count_type) as por_tipo_fb
        FROM (
            SELECT 
                type,
                created_at,
                COUNT(*) OVER (PARTITION BY type) as count_type
            FROM feedback
        ) f
    ),
    quality_stats AS (
        SELECT 
            COUNT(*) as total_quality,
            COUNT(*) FILTER (WHERE quality_rating = 'useful') as useful_count,
            COUNT(*) FILTER (WHERE quality_rating = 'needs_improvement') as needs_improvement_count,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND(
                        (COUNT(*) FILTER (WHERE quality_rating = 'useful')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
                        2
                    )
                ELSE 0
            END as avg_quality
        FROM quality_feedback
    )
    SELECT 
        fs.total_fb,
        fs.fb_mes,
        fs.por_tipo_fb,
        qs.total_quality,
        qs.useful_count,
        qs.needs_improvement_count,
        qs.avg_quality
    FROM feedback_stats fs, quality_stats qs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener feedback reciente
CREATE OR REPLACE FUNCTION get_recent_feedback(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    id UUID,
    text TEXT,
    type VARCHAR,
    email VARCHAR,
    created_at TIMESTAMPTZ,
    source VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    (
        SELECT 
            f.id,
            f.text,
            f.type,
            f.email,
            f.created_at,
            'general'::VARCHAR as source
        FROM feedback f
        ORDER BY f.created_at DESC
        LIMIT limit_count / 2
    )
    UNION ALL
    (
        SELECT 
            qf.id,
            COALESCE(qf.feedback_text, 'Sin comentarios adicionales') as text,
            qf.quality_rating as type,
            p.email,
            qf.created_at,
            'quality'::VARCHAR as source
        FROM quality_feedback qf
        LEFT JOIN profiles pr ON pr.id = qf.user_id
        LEFT JOIN auth.users p ON p.id = qf.user_id
        ORDER BY qf.created_at DESC
        LIMIT limit_count / 2
    )
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar feedback como procesado
CREATE OR REPLACE FUNCTION mark_feedback_processed(feedback_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE feedback 
    SET updated_at = NOW()
    WHERE id = feedback_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. VISTA PARA DASHBOARD DE FEEDBACK
-- =====================================================
CREATE OR REPLACE VIEW feedback_dashboard AS
SELECT 
    'feedback_general' as metric_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as ultima_semana,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as ultimo_mes,
    0 as rating_promedio
FROM feedback
UNION ALL
SELECT 
    'quality_feedback' as metric_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as ultima_semana,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as ultimo_mes,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            ROUND(
                (COUNT(*) FILTER (WHERE quality_rating = 'useful')::NUMERIC / COUNT(*)::NUMERIC) * 100
            )
        ELSE 0
    END as rating_promedio
FROM quality_feedback;

-- 10. DATOS INICIALES
-- =====================================================

-- Insertar categorías de feedback por defecto
INSERT INTO feedback_categories (name, description, color, is_active)
VALUES 
    ('bug', 'Reportes de errores o problemas técnicos', '#EF4444', true),
    ('suggestion', 'Sugerencias de mejora', '#3B82F6', true),
    ('feature_request', 'Solicitudes de nuevas funcionalidades', '#10B981', true),
    ('ui_ux', 'Comentarios sobre interfaz y experiencia de usuario', '#8B5CF6', true),
    ('performance', 'Problemas de rendimiento', '#F59E0B', true),
    ('other', 'Otros comentarios', '#6B7280', true)
ON CONFLICT (name) DO NOTHING;

-- 11. PERMISOS Y SEGURIDAD
-- =====================================================

-- Permisos para funciones
GRANT EXECUTE ON FUNCTION get_feedback_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_feedback(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_feedback_processed(UUID) TO authenticated;

-- Permisos para vistas
ALTER VIEW feedback_dashboard OWNER TO postgres;

COMMENT ON FUNCTION get_feedback_stats() IS 'Obtiene estadísticas completas del sistema de feedback';
COMMENT ON FUNCTION get_recent_feedback(INTEGER) IS 'Obtiene feedback reciente del sistema';
COMMENT ON FUNCTION mark_feedback_processed(UUID) IS 'Marca un feedback como procesado';
COMMENT ON VIEW feedback_dashboard IS 'Vista para dashboard de feedback con métricas';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Migración de sistema de feedback completada';
    RAISE NOTICE 'Tablas creadas: feedback, quality_feedback, feedback_categories';
    RAISE NOTICE 'Funciones: get_feedback_stats, get_recent_feedback, mark_feedback_processed';
    RAISE NOTICE 'Vista: feedback_dashboard';
END $$;