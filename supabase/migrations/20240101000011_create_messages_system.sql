-- Migración: Crear sistema de mensajes
-- =====================================================
-- Esta migración crea las tablas para el sistema de mensajes:
-- messages (mensajes generales) y parent_messages (mensajes para padres)

-- 1. TABLA MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_category ON messages(category);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_title ON messages USING gin(to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_messages_content ON messages USING gin(to_tsvector('spanish', content));

-- Trigger para updated_at en messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLA PARENT_MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS parent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general' CHECK (message_type IN ('general', 'academico', 'comportamiento', 'evento', 'tarea', 'citatorio')),
    recipient_type VARCHAR(20) DEFAULT 'grupo' CHECK (recipient_type IN ('grupo', 'individual')),
    
    -- Información del destinatario
    parent_name VARCHAR(255),
    parent_email VARCHAR(255),
    parent_phone VARCHAR(20),
    
    -- Estado del mensaje
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    delivery_method VARCHAR(20) DEFAULT 'email' CHECK (delivery_method IN ('email', 'whatsapp', 'sms', 'manual')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: si es individual debe tener alumno_id
    CONSTRAINT check_individual_message CHECK (
        (recipient_type = 'individual' AND alumno_id IS NOT NULL) OR
        (recipient_type = 'grupo' AND grupo_id IS NOT NULL)
    )
);

-- Índices para parent_messages
CREATE INDEX IF NOT EXISTS idx_parent_messages_user_id ON parent_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_grupo_id ON parent_messages(grupo_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_alumno_id ON parent_messages(alumno_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_type ON parent_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_parent_messages_recipient_type ON parent_messages(recipient_type);
CREATE INDEX IF NOT EXISTS idx_parent_messages_is_sent ON parent_messages(is_sent);
CREATE INDEX IF NOT EXISTS idx_parent_messages_created_at ON parent_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_messages_parent_email ON parent_messages(parent_email);

-- Trigger para updated_at en parent_messages
CREATE TRIGGER update_parent_messages_updated_at
    BEFORE UPDATE ON parent_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. TABLA MESSAGE_TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('general', 'academico', 'comportamiento', 'evento', 'tarea', 'citatorio')),
    subject_template VARCHAR(255),
    content_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Array de variables disponibles
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para message_templates
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_public ON message_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_message_templates_usage ON message_templates(usage_count DESC);

-- Trigger para updated_at en message_templates
CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE messages IS 'Tabla para mensajes generales del sistema';
COMMENT ON COLUMN messages.user_id IS 'ID del usuario que creó el mensaje';
COMMENT ON COLUMN messages.title IS 'Título del mensaje';
COMMENT ON COLUMN messages.content IS 'Contenido del mensaje';
COMMENT ON COLUMN messages.category IS 'Categoría del mensaje';

COMMENT ON TABLE parent_messages IS 'Tabla para mensajes dirigidos a padres de familia';
COMMENT ON COLUMN parent_messages.user_id IS 'ID del profesor que envía el mensaje';
COMMENT ON COLUMN parent_messages.grupo_id IS 'ID del grupo (para mensajes grupales)';
COMMENT ON COLUMN parent_messages.alumno_id IS 'ID del alumno (para mensajes individuales)';
COMMENT ON COLUMN parent_messages.message_type IS 'Tipo de mensaje: general, academico, comportamiento, etc.';
COMMENT ON COLUMN parent_messages.recipient_type IS 'Tipo de destinatario: grupo o individual';
COMMENT ON COLUMN parent_messages.delivery_method IS 'Método de entrega: email, whatsapp, sms, manual';

COMMENT ON TABLE message_templates IS 'Plantillas reutilizables para mensajes';
COMMENT ON COLUMN message_templates.variables IS 'Variables disponibles en la plantilla (formato JSON)';
COMMENT ON COLUMN message_templates.usage_count IS 'Número de veces que se ha usado la plantilla';

-- 5. POLÍTICAS RLS PARA MESSAGES
-- =====================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política para ver mensajes
CREATE POLICY "Usuarios pueden ver sus propios mensajes" ON messages
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para crear mensajes
CREATE POLICY "Usuarios pueden crear mensajes" ON messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
    );

-- Política para actualizar mensajes
CREATE POLICY "Usuarios pueden actualizar sus mensajes" ON messages
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar mensajes
CREATE POLICY "Usuarios pueden eliminar sus mensajes" ON messages
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 6. POLÍTICAS RLS PARA PARENT_MESSAGES
-- =====================================================
ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;

-- Política para ver mensajes de padres
CREATE POLICY "Ver mensajes de padres según permisos" ON parent_messages
    FOR SELECT USING (
        user_id = auth.uid() -- Profesor que creó el mensaje
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND (
                    (parent_messages.grupo_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM grupos g WHERE g.id = parent_messages.grupo_id AND g.plantel_id = p.plantel_id
                    ))
                    OR (parent_messages.alumno_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM alumnos a JOIN grupos g ON g.id = a.grupo_id 
                        WHERE a.id = parent_messages.alumno_id AND g.plantel_id = p.plantel_id
                    ))
                ))
            )
        )
    );

-- Política para crear mensajes de padres
CREATE POLICY "Crear mensajes de padres según permisos" ON parent_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
        AND (
            (grupo_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM grupos g
                JOIN profiles p ON p.id = auth.uid()
                WHERE g.id = parent_messages.grupo_id
                AND (
                    p.role = 'administrador'
                    OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                    OR (p.role = 'profesor' AND g.user_id = auth.uid())
                )
            ))
            OR (alumno_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM alumnos a
                JOIN grupos g ON g.id = a.grupo_id
                JOIN profiles p ON p.id = auth.uid()
                WHERE a.id = parent_messages.alumno_id
                AND (
                    p.role = 'administrador'
                    OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                    OR (p.role = 'profesor' AND g.user_id = auth.uid())
                )
            ))
        )
    );

-- Política para actualizar mensajes de padres
CREATE POLICY "Actualizar mensajes de padres propios" ON parent_messages
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar mensajes de padres
CREATE POLICY "Eliminar mensajes de padres propios" ON parent_messages
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 7. POLÍTICAS RLS PARA MESSAGE_TEMPLATES
-- =====================================================
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Política para ver plantillas
CREATE POLICY "Ver plantillas según permisos" ON message_templates
    FOR SELECT USING (
        user_id = auth.uid() -- Propietario
        OR is_public = true -- Plantillas públicas
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para crear plantillas
CREATE POLICY "Crear plantillas" ON message_templates
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
    );

-- Política para actualizar plantillas
CREATE POLICY "Actualizar plantillas propias" ON message_templates
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar plantillas
CREATE POLICY "Eliminar plantillas propias" ON message_templates
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 8. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener estadísticas de mensajes
CREATE OR REPLACE FUNCTION get_messages_stats(user_id_param UUID)
RETURNS TABLE(
    total_messages BIGINT,
    messages_mes BIGINT,
    por_categoria JSONB,
    parent_messages_total BIGINT,
    parent_messages_enviados BIGINT,
    por_tipo_mensaje JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH message_stats AS (
        SELECT 
            COUNT(*) as total_msg,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as msg_mes,
            jsonb_object_agg(category, count_cat) as por_cat
        FROM (
            SELECT 
                category,
                created_at,
                COUNT(*) OVER (PARTITION BY category) as count_cat
            FROM messages 
            WHERE user_id = user_id_param
        ) m
    ),
    parent_stats AS (
        SELECT 
            COUNT(*) as total_parent,
            COUNT(*) FILTER (WHERE is_sent = true) as parent_enviados,
            jsonb_object_agg(message_type, count_type) as por_tipo
        FROM (
            SELECT 
                message_type,
                is_sent,
                COUNT(*) OVER (PARTITION BY message_type) as count_type
            FROM parent_messages 
            WHERE user_id = user_id_param
        ) pm
    )
    SELECT 
        ms.total_msg,
        ms.msg_mes,
        ms.por_cat,
        ps.total_parent,
        ps.parent_enviados,
        ps.por_tipo
    FROM message_stats ms, parent_stats ps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar mensaje como enviado
CREATE OR REPLACE FUNCTION mark_parent_message_sent(message_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE parent_messages 
    SET 
        is_sent = true,
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = message_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para incrementar uso de plantilla
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE message_templates 
    SET 
        usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_messages_stats(UUID) IS 'Obtiene estadísticas completas de mensajes para un usuario';
COMMENT ON FUNCTION mark_parent_message_sent(UUID) IS 'Marca un mensaje de padre como enviado';
COMMENT ON FUNCTION increment_template_usage(UUID) IS 'Incrementa el contador de uso de una plantilla';