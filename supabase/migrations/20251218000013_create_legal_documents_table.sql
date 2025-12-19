-- Asegurar que la extensión vector está habilitada
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Tabla para almacenar fragmentos de leyes y protocolos (RAG)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL, -- Ej: "Protocolo SEP 2020 - Armas"
  category text, -- 'seguridad', 'salud', 'acoso'
  content text NOT NULL, -- El texto extraído del PDF
  embedding extensions.vector(768), -- El vector para que Gemini busque
  page_number int, -- Para citar: "Ver página 32"
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar búsqueda semántica (función RPC)
CREATE OR REPLACE FUNCTION match_legal_documents (
  query_embedding extensions.vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT
      legal_documents.id,
      legal_documents.content,
      legal_documents.title,
      1 - (legal_documents.embedding <=> query_embedding) AS similarity
    FROM legal_documents
    WHERE 1 - (legal_documents.embedding <=> query_embedding) > match_threshold
    AND active = true
    ORDER BY legal_documents.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Habilitar RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Política de lectura para todos los usuarios autenticados (necesario para la búsqueda)
CREATE POLICY "Usuarios autenticados pueden leer documentos legales"
ON public.legal_documents
FOR SELECT
TO authenticated
USING (true);

-- Política de administración para administradores (Insert/Update/Delete)
CREATE POLICY "Administradores pueden gestionar documentos legales"
ON public.legal_documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'administrador'
  )
);
