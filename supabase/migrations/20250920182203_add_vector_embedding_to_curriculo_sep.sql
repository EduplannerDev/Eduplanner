-- Migración: Agregar metadatos para embeddings vectoriales en curriculo_sep
-- =====================================================
-- Esta migración agrega campos de metadatos para los embeddings
-- (La columna embedding vector(1536) ya fue agregada manualmente)

-- 1. AGREGAR CAMPOS DE METADATOS DEL EMBEDDING
-- =====================================================
-- Información sobre el modelo usado para generar el embedding
ALTER TABLE curriculo_sep 
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);

ALTER TABLE curriculo_sep 
ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMP WITH TIME ZONE;

-- 2. CREAR FUNCIÓN PARA OBTENER EMBEDDINGS FALTANTES
-- =====================================================
-- Función para identificar registros que necesitan embeddings
CREATE OR REPLACE FUNCTION get_curriculo_without_embeddings()
RETURNS TABLE (
    id UUID,
    contenido VARCHAR(255),
    materia VARCHAR(100),
    grado INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.contenido,
        cs.materia,
        cs.grado
    FROM curriculo_sep cs
    WHERE cs.embedding IS NULL
    ORDER BY cs.grado, cs.materia, cs.contenido;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.1. CREAR FUNCIÓN PARA BÚSQUEDA SEMÁNTICA MEJORADA
-- =====================================================
-- Función que busca PDAs relevantes usando embeddings vectoriales
CREATE OR REPLACE FUNCTION search_curriculo_by_similarity(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    grado_filter int DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    contenido VARCHAR(255),
    materia VARCHAR(100),
    grado INTEGER,
    bloque VARCHAR(100),
    campo_formativo VARCHAR(100),
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.contenido,
        cs.materia,
        cs.grado,
        cs.bloque,
        cs.campo_formativo,
        1 / (1 + (cs.embedding <-> query_embedding)) as similarity
    FROM curriculo_sep cs
    WHERE 
        cs.embedding IS NOT NULL
        AND (grado_filter IS NULL OR cs.grado = grado_filter)
        AND 1 / (1 + (cs.embedding <-> query_embedding)) > match_threshold
    ORDER BY cs.embedding <-> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR FUNCIÓN PARA ACTUALIZAR METADATOS DE EMBEDDING
-- =====================================================
-- Función para actualizar los metadatos del embedding
CREATE OR REPLACE FUNCTION update_curriculo_embedding_metadata(
    p_id UUID,
    p_model VARCHAR(100) DEFAULT 'openai-ada-002'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE curriculo_sep 
    SET 
        embedding_model = p_model,
        embedding_created_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON COLUMN curriculo_sep.embedding IS 'Embedding vectorial para búsquedas semánticas (1536 dimensiones)';
COMMENT ON COLUMN curriculo_sep.embedding_model IS 'Modelo usado para generar el embedding';
COMMENT ON COLUMN curriculo_sep.embedding_created_at IS 'Fecha y hora de creación del embedding';
COMMENT ON FUNCTION get_curriculo_without_embeddings IS 'Obtiene registros que necesitan generar embeddings';
COMMENT ON FUNCTION update_curriculo_embedding_metadata IS 'Actualiza los metadatos del embedding';

-- 5. MENSAJE DE FINALIZACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Migración de metadatos de embeddings completada exitosamente';
    RAISE NOTICE 'Se agregaron campos de metadatos para embeddings';
    RAISE NOTICE 'Se crearon funciones para gestionar embeddings';
    RAISE NOTICE 'Total de registros en curriculo_sep: %', (SELECT COUNT(*) FROM curriculo_sep);
    RAISE NOTICE 'Registros sin embedding: %', (SELECT COUNT(*) FROM curriculo_sep WHERE embedding IS NULL);
END $$;
