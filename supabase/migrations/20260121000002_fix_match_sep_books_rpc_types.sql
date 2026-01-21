-- Migración: Corregir tipos de retorno en función match_sep_books_content
-- =================================================================

-- Asegurar search_path
SET search_path = public, extensions;

-- Redefinir la función con castings explícitos para evitar error "expected type text... got character varying"
CREATE OR REPLACE FUNCTION match_sep_books_content (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  grado_filter text default null
)
RETURNS TABLE (
  id uuid,
  libro_codigo text,
  libro_titulo text,
  grado text,
  pagina int,
  contenido text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sep_books_content.id,
    sep_books_content.libro_codigo::text,           -- Cast explícito a text
    sep_books_content.libro_nombre::text as libro_titulo, -- Cast explícito a text
    sep_books_content.grado::text,                  -- Cast explícito a text
    sep_books_content.pagina_inicio as pagina,
    sep_books_content.contenido,
    1 - (sep_books_content.embedding <=> query_embedding) as similarity
  FROM sep_books_content
  WHERE 1 - (sep_books_content.embedding <=> query_embedding) > match_threshold
  -- Filtro opcional por grado (ej: '4°')
  AND (grado_filter IS NULL OR sep_books_content.grado = grado_filter)
  ORDER BY sep_books_content.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
