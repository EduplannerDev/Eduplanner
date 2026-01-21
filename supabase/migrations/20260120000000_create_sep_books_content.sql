-- Migration: Create table for SEP books content
-- Description: Stores vectorized content from official SEP textbooks for RAG system

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- Add extensions schema to search path so we can use the vector type
SET search_path TO public, extensions;

-- Create table for SEP books content
CREATE TABLE IF NOT EXISTS sep_books_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  libro_codigo VARCHAR(10) NOT NULL,
  libro_nombre TEXT NOT NULL,
  grado VARCHAR(10) NOT NULL,
  nivel VARCHAR(20) NOT NULL, -- 'Primaria' o 'Secundaria'
  materia VARCHAR(100),
  ciclo_escolar VARCHAR(10) NOT NULL,
  seccion TEXT,
  contenido TEXT NOT NULL,
  pagina_inicio INT NOT NULL,
  pagina_fin INT NOT NULL,
  embedding vector(768), -- Google text-embedding-004
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sep_books_codigo ON sep_books_content(libro_codigo);
CREATE INDEX idx_sep_books_grado ON sep_books_content(grado);
CREATE INDEX idx_sep_books_nivel ON sep_books_content(nivel);
CREATE INDEX idx_sep_books_materia ON sep_books_content(materia);
CREATE INDEX idx_sep_books_ciclo ON sep_books_content(ciclo_escolar);

-- Create vector index for similarity search (using ivfflat)
CREATE INDEX ON sep_books_content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create RPC function for similarity search
CREATE OR REPLACE FUNCTION search_sep_books_by_similarity(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.6,
  match_count INT DEFAULT 5,
  grado_filter VARCHAR DEFAULT NULL,
  nivel_filter VARCHAR DEFAULT NULL,
  materia_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  libro_codigo VARCHAR,
  libro_nombre TEXT,
  grado VARCHAR,
  nivel VARCHAR,
  materia VARCHAR,
  seccion TEXT,
  contenido TEXT,
  pagina_inicio INT,
  pagina_fin INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sep_books_content.id,
    sep_books_content.libro_codigo,
    sep_books_content.libro_nombre,
    sep_books_content.grado,
    sep_books_content.nivel,
    sep_books_content.materia,
    sep_books_content.seccion,
    sep_books_content.contenido,
    sep_books_content.pagina_inicio,
    sep_books_content.pagina_fin,
    1 - (sep_books_content.embedding <=> query_embedding) AS similarity
  FROM sep_books_content
  WHERE 
    (grado_filter IS NULL OR sep_books_content.grado = grado_filter)
    AND (nivel_filter IS NULL OR sep_books_content.nivel = nivel_filter)
    AND (materia_filter IS NULL OR sep_books_content.materia = materia_filter)
    AND (1 - (sep_books_content.embedding <=> query_embedding)) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment to table
COMMENT ON TABLE sep_books_content IS 'Stores vectorized content from official SEP textbooks for semantic search in RAG system';

-- Add comment to function
COMMENT ON FUNCTION search_sep_books_by_similarity IS 'Performs similarity search on SEP books content with optional filters for grade, level, and subject';
