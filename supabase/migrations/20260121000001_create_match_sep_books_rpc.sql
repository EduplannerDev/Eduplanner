-- 1. Asegurar que la extensión pgvector está habilitada y accesible
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Establecer el search_path para que encuentre el tipo 'vector'
SET search_path = public, extensions;

-- 2. Crear la función de búsqueda semántica (RPC)
-- Esta función coincide con la lógica de integración en Eduplanner
create or replace function match_sep_books_content (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  grado_filter text default null
)
returns table (
  id uuid,
  libro_codigo text,
  libro_titulo text,
  grado text,
  pagina int,
  contenido text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    sep_books_content.id,
    sep_books_content.libro_codigo,
    sep_books_content.libro_nombre as libro_titulo,
    sep_books_content.grado,
    sep_books_content.pagina_inicio as pagina,
    sep_books_content.contenido,
    1 - (sep_books_content.embedding <=> query_embedding) as similarity
  from sep_books_content
  where 1 - (sep_books_content.embedding <=> query_embedding) > match_threshold
  -- Filtro opcional por grado (ej: '4°')
  and (grado_filter is null or sep_books_content.grado = grado_filter)
  order by sep_books_content.embedding <=> query_embedding
  limit match_count;
end;
$$;
