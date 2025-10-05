-- Migración: Crear tabla proyecto_recursos y bucket de storage
-- =====================================================
-- Esta migración crea la tabla para gestionar recursos de proyectos
-- y configura el bucket de Supabase Storage para archivos

-- 1. CREAR TABLA PROYECTO_RECURSOS
-- =====================================================
CREATE TABLE IF NOT EXISTS proyecto_recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    tamaño BIGINT NOT NULL,
    url TEXT NOT NULL,
    archivo_path TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_proyecto_recursos_proyecto_id ON proyecto_recursos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_recursos_user_id ON proyecto_recursos(user_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_recursos_created_at ON proyecto_recursos(created_at);

-- 3. CONFIGURAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE proyecto_recursos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios pueden ver recursos de sus proyectos" ON proyecto_recursos;
DROP POLICY IF EXISTS "Usuarios pueden gestionar recursos de sus proyectos" ON proyecto_recursos;
DROP POLICY IF EXISTS "Directores pueden ver recursos de proyectos de su plantel" ON proyecto_recursos;
DROP POLICY IF EXISTS "Administradores pueden gestionar todos los recursos" ON proyecto_recursos;

-- Política para que usuarios puedan ver recursos de sus proyectos
CREATE POLICY "Usuarios pueden ver recursos de sus proyectos" ON proyecto_recursos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proyectos p
            WHERE p.id = proyecto_recursos.proyecto_id
            AND p.profesor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        OR EXISTS (
            SELECT 1 FROM proyectos p
            JOIN grupos g ON g.id = p.grupo_id
            JOIN profiles director ON director.plantel_id = g.plantel_id
            WHERE p.id = proyecto_recursos.proyecto_id
            AND director.id = auth.uid()
            AND director.role = 'director'
            AND director.activo = true
        )
    );

-- Política para que usuarios puedan gestionar recursos de sus proyectos
CREATE POLICY "Usuarios pueden gestionar recursos de sus proyectos" ON proyecto_recursos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proyectos p
            WHERE p.id = proyecto_recursos.proyecto_id
            AND p.profesor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        OR EXISTS (
            SELECT 1 FROM proyectos p
            JOIN grupos g ON g.id = p.grupo_id
            JOIN profiles director ON director.plantel_id = g.plantel_id
            WHERE p.id = proyecto_recursos.proyecto_id
            AND director.id = auth.uid()
            AND director.role = 'director'
            AND director.activo = true
        )
    );

-- 4. CREAR TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proyecto_recursos_updated_at
    BEFORE UPDATE ON proyecto_recursos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. COMENTARIOS
-- =====================================================
COMMENT ON TABLE proyecto_recursos IS 'Tabla para gestionar recursos (archivos) asociados a proyectos';
COMMENT ON COLUMN proyecto_recursos.archivo_path IS 'Ruta del archivo en Supabase Storage';
COMMENT ON COLUMN proyecto_recursos.url IS 'URL pública del archivo para descarga/visualización';
