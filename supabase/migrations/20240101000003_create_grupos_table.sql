-- Migración: Crear tabla grupos
-- =====================================================
-- Esta migración crea la tabla grupos que es necesaria para el sistema
-- Debe ejecutarse antes de la migración update_grupos.sql

-- 1. CREAR TABLA GRUPOS
-- =====================================================
CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    grado VARCHAR(50),
    grupo VARCHAR(10),
    ciclo_escolar VARCHAR(20),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR TRIGGER PARA UPDATED_AT EN GRUPOS
-- =====================================================
CREATE TRIGGER update_grupos_updated_at
    BEFORE UPDATE ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. CREAR ÍNDICES PARA GRUPOS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_grupos_user_id ON grupos(user_id);
CREATE INDEX IF NOT EXISTS idx_grupos_grado ON grupos(grado);
CREATE INDEX IF NOT EXISTS idx_grupos_ciclo ON grupos(ciclo_escolar);

-- 4. HABILITAR RLS EN GRUPOS
-- =====================================================
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;

-- 5. COMENTARIOS PARA GRUPOS
-- =====================================================
COMMENT ON TABLE grupos IS 'Tabla de grupos escolares del sistema';
COMMENT ON COLUMN grupos.grado IS 'Grado escolar (1°, 2°, 3°, etc.)';
COMMENT ON COLUMN grupos.grupo IS 'Grupo o sección (A, B, C, etc.)';
COMMENT ON COLUMN grupos.ciclo_escolar IS 'Ciclo escolar (2023-2024, etc.)';
COMMENT ON COLUMN grupos.user_id IS 'Profesor responsable del grupo';