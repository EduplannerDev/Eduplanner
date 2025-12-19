-- Migration: Add acta_firmada_url to incidencias table
-- This column will store the Supabase Storage URL of the signed PDF document

ALTER TABLE incidencias 
ADD COLUMN IF NOT EXISTS acta_firmada_url TEXT;

COMMENT ON COLUMN incidencias.acta_firmada_url IS 'URL del acta firmada subida a Supabase Storage';
