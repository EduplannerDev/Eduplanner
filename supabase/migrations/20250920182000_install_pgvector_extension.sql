-- Migración: Instalar extensión pgvector para embeddings
-- Fecha: 2025-09-20 18:00:00
-- Descripción: Instala la extensión pgvector necesaria para embeddings vectoriales

-- Instalar la extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Extensión pgvector instalada exitosamente';
    RAISE NOTICE 'Ahora se pueden usar tipos vector para embeddings';
END $$;
