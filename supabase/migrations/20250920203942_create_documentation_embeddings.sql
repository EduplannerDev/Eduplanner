-- Migración: Crear tabla de documentación vectorizada
-- =====================================================
-- Esta migración crea la tabla para almacenar documentación de flujos
-- con embeddings vectoriales para búsquedas semánticas

-- 1. CREAR TABLA DOCUMENTATION_EMBEDDINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS documentation_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name VARCHAR(100) NOT NULL, -- Nombre del módulo (ej: "planeaciones", "examenes", "proyectos")
    flow_type VARCHAR(100) NOT NULL, -- Tipo de flujo (ej: "crear", "gestionar", "editar")
    title VARCHAR(255) NOT NULL, -- Título del documento
    content TEXT NOT NULL, -- Contenido completo del documento
    file_path VARCHAR(500) NOT NULL, -- Ruta del archivo original
    section_title VARCHAR(255), -- Título de la sección específica (si aplica)
    section_content TEXT, -- Contenido de la sección específica
    keywords TEXT[], -- Palabras clave para búsqueda
    embedding vector(768), -- Embedding vectorial para búsquedas semánticas (Google text-embedding-004)
    embedding_model VARCHAR(100), -- Modelo usado para generar el embedding
    embedding_created_at TIMESTAMPTZ, -- Fecha de creación del embedding
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT unique_module_flow_title UNIQUE(module_name, flow_type, title)
);

-- 2. CREAR ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- =====================================================
CREATE INDEX idx_documentation_module_name ON documentation_embeddings(module_name);
CREATE INDEX idx_documentation_flow_type ON documentation_embeddings(flow_type);
CREATE INDEX idx_documentation_keywords ON documentation_embeddings USING GIN(keywords);
CREATE INDEX idx_documentation_embedding ON documentation_embeddings USING ivfflat (embedding vector_cosine_ops);

-- 3. HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE documentation_embeddings ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden leer la documentación
CREATE POLICY "documentation_select_policy" ON documentation_embeddings
    FOR SELECT TO authenticated
    USING (true);

-- Política: Solo administradores pueden insertar/actualizar documentación
CREATE POLICY "documentation_insert_policy" ON documentation_embeddings
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'administrador'
        )
    );

CREATE POLICY "documentation_update_policy" ON documentation_embeddings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'administrador'
        )
    );

-- 4. CREAR FUNCIONES PARA GESTIONAR EMBEDDINGS
-- =====================================================

-- Función para obtener documentación sin embeddings
CREATE OR REPLACE FUNCTION get_documentation_without_embeddings()
RETURNS TABLE (
    id UUID,
    module_name VARCHAR(100),
    flow_type VARCHAR(100),
    title VARCHAR(255),
    content TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.module_name,
        de.flow_type,
        de.title,
        de.content
    FROM documentation_embeddings de
    WHERE de.embedding IS NULL
    ORDER BY de.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar embedding
CREATE OR REPLACE FUNCTION update_documentation_embedding(
    doc_id UUID,
    embedding_vector vector(768),
    model_name VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE documentation_embeddings 
    SET 
        embedding = embedding_vector,
        embedding_model = model_name,
        embedding_created_at = NOW(),
        updated_at = NOW()
    WHERE id = doc_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para búsqueda semántica de documentación
CREATE OR REPLACE FUNCTION search_documentation_by_similarity(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5,
    module_filter VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    module_name VARCHAR(100),
    flow_type VARCHAR(100),
    title VARCHAR(255),
    content TEXT,
    section_title VARCHAR(255),
    section_content TEXT,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.module_name,
        de.flow_type,
        de.title,
        de.content,
        de.section_title,
        de.section_content,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM documentation_embeddings de
    WHERE 
        de.embedding IS NOT NULL
        AND (module_filter IS NULL OR de.module_name = module_filter)
        AND 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE documentation_embeddings IS 'Almacena documentación de flujos con embeddings vectoriales para búsquedas semánticas';
COMMENT ON COLUMN documentation_embeddings.module_name IS 'Nombre del módulo (planeaciones, examenes, proyectos, etc.)';
COMMENT ON COLUMN documentation_embeddings.flow_type IS 'Tipo de flujo (crear, gestionar, editar, etc.)';
COMMENT ON COLUMN documentation_embeddings.embedding IS 'Embedding vectorial para búsquedas semánticas (768 dimensiones - Google text-embedding-004)';
COMMENT ON COLUMN documentation_embeddings.keywords IS 'Palabras clave extraídas del contenido para búsqueda adicional';
COMMENT ON FUNCTION search_documentation_by_similarity IS 'Busca documentación por similitud semántica usando embeddings';

-- 6. MENSAJE DE FINALIZACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Migración de documentación vectorizada completada exitosamente';
    RAISE NOTICE 'Se creó la tabla documentation_embeddings';
    RAISE NOTICE 'Se configuraron políticas RLS para seguridad';
    RAISE NOTICE 'Se crearon funciones para gestión de embeddings';
    RAISE NOTICE 'Se crearon índices para optimizar búsquedas';
END $$;