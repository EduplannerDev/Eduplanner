-- Migración: Crear tabla profiles
-- =====================================================
-- Esta migración crea la tabla profiles que es fundamental para el sistema
-- Debe ejecutarse antes de la migración 20240101000002_update_profiles.sql

-- 1. CREAR TABLA PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR TRIGGER PARA UPDATED_AT EN PROFILES
-- =====================================================
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. CREAR ÍNDICES BÁSICOS PARA PROFILES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_basic ON profiles(email);

-- 4. COMENTARIOS PARA PROFILES
-- =====================================================
COMMENT ON TABLE profiles IS 'Tabla de perfiles de usuarios del sistema';
COMMENT ON COLUMN profiles.id IS 'ID del usuario (referencia a auth.users)';
COMMENT ON COLUMN profiles.full_name IS 'Nombre completo del usuario';
COMMENT ON COLUMN profiles.email IS 'Email del usuario';
COMMENT ON COLUMN profiles.avatar_url IS 'URL del avatar del usuario';

-- 5. HABILITAR RLS EN PROFILES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLÍTICAS RLS BÁSICAS PARA PROFILES
-- =====================================================
-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para que se puedan insertar nuevos perfiles
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. CREAR FUNCIÓN PARA MANEJAR NUEVOS USUARIOS (BÁSICA)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_basic()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREAR TRIGGER PARA NUEVOS USUARIOS (BÁSICO)
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created_basic ON auth.users;
CREATE TRIGGER on_auth_user_created_basic
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_basic();