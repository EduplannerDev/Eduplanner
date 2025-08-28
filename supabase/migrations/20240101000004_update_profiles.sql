-- Migración: Actualizar tabla profiles
-- =====================================================
-- Esta migración actualiza la tabla profiles para incluir los nuevos campos
-- relacionados con planteles y roles

-- 1. AGREGAR NUEVAS COLUMNAS A PROFILES
-- =====================================================
-- Agregar plantel_id
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plantel_id UUID REFERENCES planteles(id);

-- Agregar role
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'profesor';

-- Agregar telefono
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS telefono TEXT;

-- Agregar activo
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Agregar updated_at si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. CREAR TRIGGER PARA UPDATED_AT EN PROFILES
-- =====================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. CREAR ÍNDICES PARA PROFILES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_plantel_id ON profiles(plantel_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_activo ON profiles(activo);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 4. ACTUALIZAR PERFILES EXISTENTES
-- =====================================================
-- Asegurar que todos los perfiles tengan valores por defecto
UPDATE profiles 
SET 
    role = 'profesor',
    activo = true,
    updated_at = NOW()
WHERE role IS NULL OR activo IS NULL;

-- 5. COMENTARIOS PARA PROFILES
-- =====================================================
COMMENT ON COLUMN profiles.plantel_id IS 'ID del plantel principal al que pertenece el usuario';
COMMENT ON COLUMN profiles.role IS 'Rol del usuario en el sistema';
COMMENT ON COLUMN profiles.telefono IS 'Número de teléfono del usuario';
COMMENT ON COLUMN profiles.activo IS 'Estado activo/inactivo del usuario';

-- 6. CREAR FUNCIÓN PARA MANEJAR NUEVOS USUARIOS
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, activo)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email,
    'profesor', -- Rol por defecto
    true -- Activo por defecto
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar errores si ya existe
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREAR TRIGGER PARA NUEVOS USUARIOS
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();