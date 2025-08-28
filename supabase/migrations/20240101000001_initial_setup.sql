-- Migración inicial: Configuración básica del sistema
-- =====================================================
-- Esta migración establece la estructura base del sistema educativo

-- 1. CREAR EXTENSIONES NECESARIAS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREAR FUNCIÓN PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. CREAR ENUM PARA ROLES
-- =====================================================
CREATE TYPE user_role AS ENUM ('administrador', 'director', 'profesor');

-- 4. CREAR TABLA PLANTELES
-- =====================================================
CREATE TABLE IF NOT EXISTS planteles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    codigo_plantel TEXT UNIQUE,
    nivel_educativo TEXT NOT NULL,
    ciudad TEXT,
    estado TEXT,
    codigo_postal TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREAR TRIGGER PARA UPDATED_AT EN PLANTELES
-- =====================================================
CREATE TRIGGER update_planteles_updated_at
    BEFORE UPDATE ON planteles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. CREAR ÍNDICES PARA PLANTELES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_planteles_codigo ON planteles(codigo_plantel);
CREATE INDEX IF NOT EXISTS idx_planteles_activo ON planteles(activo);
CREATE INDEX IF NOT EXISTS idx_planteles_nivel ON planteles(nivel_educativo);

-- 7. COMENTARIOS PARA PLANTELES
-- =====================================================
COMMENT ON TABLE planteles IS 'Tabla de planteles educativos del sistema';
COMMENT ON COLUMN planteles.codigo_plantel IS 'Código único del plantel';
COMMENT ON COLUMN planteles.nivel_educativo IS 'Nivel educativo (Primaria, Secundaria, etc.)';
COMMENT ON COLUMN planteles.activo IS 'Estado activo/inactivo del plantel';

-- 8. INSERTAR DATOS DE EJEMPLO
-- =====================================================
INSERT INTO planteles (nombre, codigo_plantel, nivel_educativo, ciudad, estado, activo)
VALUES 
  ('Escuela Primaria Benito Juárez', 'ESC001', 'Primaria', 'Ciudad de México', 'CDMX', true),
  ('Secundaria Técnica No. 1', 'SEC001', 'Secundaria', 'Guadalajara', 'Jalisco', true)
ON CONFLICT (codigo_plantel) DO NOTHING;