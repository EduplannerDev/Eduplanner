-- Migración: Agregar campos adicionales a la tabla profiles
-- =====================================================
-- Esta migración agrega las columnas city, state, school y grade
-- que son utilizadas en el componente de perfil

-- 1. AGREGAR NUEVAS COLUMNAS A PROFILES
-- =====================================================

-- Agregar city (ciudad)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Agregar state (estado)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS state TEXT;

-- Agregar school (escuela)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school TEXT;

-- Agregar grade (grado que imparte)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS grade TEXT;

-- 2. CREAR ÍNDICES PARA LAS NUEVAS COLUMNAS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles(school);
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON profiles(grade);

-- 3. COMENTARIOS PARA LAS NUEVAS COLUMNAS
-- =====================================================
COMMENT ON COLUMN profiles.city IS 'Ciudad donde reside el usuario';
COMMENT ON COLUMN profiles.state IS 'Estado donde reside el usuario';
COMMENT ON COLUMN profiles.school IS 'Escuela donde trabaja el usuario';
COMMENT ON COLUMN profiles.grade IS 'Grado que imparte el usuario';