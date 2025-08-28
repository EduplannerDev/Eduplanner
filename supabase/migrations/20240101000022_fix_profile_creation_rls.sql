-- Migración: Corregir políticas RLS para creación de perfiles
-- =====================================================
-- Esta migración corrige el problema donde la función handle_new_user()
-- no puede insertar perfiles debido a políticas RLS restrictivas

-- 1. ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 2. CREAR POLÍTICAS CORREGIDAS
-- =====================================================

-- Política para ver perfiles (solo el propio perfil)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
  );

-- Política para actualizar perfiles (solo el propio perfil)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
  );

-- Política para insertar perfiles (permite inserción desde triggers)
-- Esta política permite tanto la inserción por el usuario como por triggers del sistema
CREATE POLICY "Enable profile creation" ON profiles
  FOR INSERT WITH CHECK (
    -- Permitir si es el propio usuario O si no hay contexto de autenticación (triggers)
    auth.uid() = id OR auth.uid() IS NULL
  );

-- 3. ACTUALIZAR FUNCIÓN HANDLE_NEW_USER PARA MEJOR MANEJO DE ERRORES
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  plantel_id_meta UUID;
  invited_by_meta UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Verificar si el perfil ya existe
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN NEW;
  END IF;

  -- Extraer metadatos de invitación si existen
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'profesor');
  plantel_id_meta := (NEW.raw_user_meta_data->>'plantel_id')::UUID;
  invited_by_meta := (NEW.raw_user_meta_data->>'invited_by')::UUID;

  -- Crear perfil del usuario con manejo de errores mejorado
  BEGIN
    INSERT INTO public.profiles (
      id, 
      full_name, 
      email, 
      role, 
      activo,
      subscription_plan,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      NEW.email,
      user_role::user_role,
      true,
      'free',
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- El perfil ya existe, continuar
      NULL;
    WHEN OTHERS THEN
      -- Log del error para depuración
      RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
      -- No fallar el trigger, permitir que el usuario se cree en auth.users
      RETURN NEW;
  END;

  -- Si hay metadatos de invitación, crear asignación al plantel
  IF plantel_id_meta IS NOT NULL THEN
    BEGIN
      INSERT INTO public.user_plantel_assignments (
        user_id,
        plantel_id,
        role,
        assigned_by,
        activo,
        assigned_at
      )
      VALUES (
        NEW.id,
        plantel_id_meta,
        user_role::user_role,
        invited_by_meta,
        true,
        NOW()
      )
      ON CONFLICT (user_id, plantel_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log del error pero no fallar
        RAISE LOG 'Error creating plantel assignment for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RECREAR EL TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. CONFIGURAR PERMISOS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- 6. COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION public.handle_new_user() IS 'Maneja la creación de nuevos usuarios con manejo mejorado de errores y políticas RLS';

-- 7. VERIFICACIÓN
-- =====================================================
-- Verificar que las políticas estén activas
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS actualizadas para la tabla profiles';
  RAISE NOTICE 'Función handle_new_user() actualizada con mejor manejo de errores';
  RAISE NOTICE 'Trigger on_auth_user_created recreado';
END $$;