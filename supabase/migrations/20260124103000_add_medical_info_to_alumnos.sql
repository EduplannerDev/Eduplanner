-- Add medical info columns to alumnos table
ALTER TABLE alumnos 
ADD COLUMN IF NOT EXISTS alergias TEXT,
ADD COLUMN IF NOT EXISTS tipo_sangre TEXT,
ADD COLUMN IF NOT EXISTS condicion_medica TEXT,
ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre TEXT,
ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono TEXT;
