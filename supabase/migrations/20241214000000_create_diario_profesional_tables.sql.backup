-- Migration: Create Professional Diary Tables
-- Description: Creates tables for professional diary functionality with password protection
-- Author: System
-- Date: 2024-12-14

-- Tabla para almacenar las contraseñas del diario profesional
CREATE TABLE IF NOT EXISTS diary_passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla para almacenar las entradas del diario profesional
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  tags TEXT[] DEFAULT '{}',
  mood TEXT,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_diary_passwords_user_id ON diary_passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_tags ON diary_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON diary_entries(created_at);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_diary_passwords_updated_at ON diary_passwords;
CREATE TRIGGER update_diary_passwords_updated_at
    BEFORE UPDATE ON diary_passwords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON diary_entries;
CREATE TRIGGER update_diary_entries_updated_at
    BEFORE UPDATE ON diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE diary_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can only access their own diary passwords" ON diary_passwords;
DROP POLICY IF EXISTS "Users can only access their own diary entries" ON diary_entries;

-- Política para diary_passwords: los usuarios solo pueden acceder a sus propias contraseñas
CREATE POLICY "Users can only access their own diary passwords" ON diary_passwords
    FOR ALL USING (auth.uid() = user_id);

-- Política para diary_entries: los usuarios solo pueden acceder a sus propias entradas
CREATE POLICY "Users can only access their own diary entries" ON diary_entries
    FOR ALL USING (auth.uid() = user_id);

-- Comentarios para documentar las tablas
COMMENT ON TABLE diary_passwords IS 'Almacena las contraseñas hasheadas para acceder al diario profesional de cada usuario';
COMMENT ON TABLE diary_entries IS 'Almacena las entradas del diario profesional de los usuarios';

COMMENT ON COLUMN diary_passwords.password_hash IS 'Hash de la contraseña del diario (en producción usar bcrypt o similar)';
COMMENT ON COLUMN diary_entries.title IS 'Título de la entrada del diario';
COMMENT ON COLUMN diary_entries.content IS 'Contenido completo de la entrada del diario';
COMMENT ON COLUMN diary_entries.date IS 'Fecha de la entrada';
COMMENT ON COLUMN diary_entries.time IS 'Hora de la entrada';
COMMENT ON COLUMN diary_entries.tags IS 'Array de etiquetas para categorizar la entrada';
COMMENT ON COLUMN diary_entries.mood IS 'Estado de ánimo asociado a la entrada (opcional)';
COMMENT ON COLUMN diary_entries.is_private IS 'Indica si la entrada es privada (por defecto true para el diario profesional)';

-- Verificación de la migración
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Professional Diary tables created successfully';
    RAISE NOTICE 'Tables created: diary_passwords, diary_entries';
    RAISE NOTICE 'Indexes created: 5 performance indexes';
    RAISE NOTICE 'RLS policies enabled for both tables';
    RAISE NOTICE 'Triggers created for automatic updated_at management';
END $$;