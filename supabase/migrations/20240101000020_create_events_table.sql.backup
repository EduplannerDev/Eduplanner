-- Migración: Crear tabla de eventos para agenda
-- =============================================
-- Esta migración crea la estructura para el sistema de agenda con soporte para hashtags

-- 1. CREAR ENUM PARA CATEGORÍAS DE EVENTOS
-- ========================================
CREATE TYPE event_category AS ENUM ('reunion', 'entrega', 'evento-escolar', 'personal');

-- 2. CREAR TABLA DE EVENTOS
-- ========================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category event_category NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    hashtags TEXT[], -- Array de hashtags extraídos de la descripción
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR TRIGGER PARA UPDATED_AT
-- ===============================
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. CREAR ÍNDICES
-- ===============
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_hashtags ON events USING GIN(hashtags);

-- 5. FUNCIÓN PARA EXTRAER HASHTAGS
-- ===============================
CREATE OR REPLACE FUNCTION extract_hashtags(text_content TEXT)
RETURNS TEXT[] AS $$
DECLARE
    hashtags TEXT[];
BEGIN
    -- Extraer hashtags usando expresión regular
    SELECT array_agg(DISTINCT lower(substring(match FROM 2)))
    INTO hashtags
    FROM (
        SELECT regexp_split_to_table(text_content, '\s+') AS match
    ) AS words
    WHERE match ~ '^#[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]+$';
    
    RETURN COALESCE(hashtags, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER PARA EXTRAER HASHTAGS AUTOMÁTICAMENTE
-- ===============================================
CREATE OR REPLACE FUNCTION update_event_hashtags()
RETURNS TRIGGER AS $$
BEGIN
    -- Extraer hashtags de la descripción y actualizar el campo hashtags
    NEW.hashtags = extract_hashtags(COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_hashtags
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_event_hashtags();

-- 7. CONFIGURAR RLS (Row Level Security)
-- ====================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios eventos
CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan insertar sus propios eventos
CREATE POLICY "Users can insert their own events" ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar sus propios eventos
CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan eliminar sus propios eventos
CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.uid() = user_id);

-- 8. FUNCIÓN PARA BUSCAR EVENTOS POR HASHTAGS
-- ==========================================
CREATE OR REPLACE FUNCTION search_events_by_hashtags(user_uuid UUID, search_hashtags TEXT[])
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category event_category,
    event_date DATE,
    event_time TIME,
    hashtags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.title, e.description, e.category, e.event_date, e.event_time, e.hashtags, e.created_at
    FROM events e
    WHERE e.user_id = user_uuid
    AND e.hashtags && search_hashtags -- Operador de intersección de arrays
    ORDER BY e.event_date DESC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNCIÓN PARA OBTENER TODOS LOS HASHTAGS DE UN USUARIO
-- =======================================================
CREATE OR REPLACE FUNCTION get_user_hashtags(user_uuid UUID)
RETURNS TABLE (hashtag TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(e.hashtags) as hashtag, COUNT(*) as count
    FROM events e
    WHERE e.user_id = user_uuid
    AND array_length(e.hashtags, 1) > 0
    GROUP BY unnest(e.hashtags)
    ORDER BY count DESC, hashtag ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;