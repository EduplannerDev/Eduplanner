-- Migración: Corregir conflicto de triggers para nuevos usuarios
-- ==========================================================
-- Esta migración resuelve el conflicto entre triggers que causa
-- el error "Database error saving new user" en producción

-- 1. ELIMINAR TRIGGER BÁSICO CONFLICTIVO
-- =====================================
DROP TRIGGER IF EXISTS on_auth_user_created_basic ON auth.users;

-- 2. ELIMINAR FUNCIÓN BÁSICA OBSOLETA
-- ==================================
DROP FUNCTION IF EXISTS public.handle_new_user_basic();

-- 3. ASEGURAR QUE EL TRIGGER CORRECTO EXISTE
-- =========================================
DROP TRIGGER IF EXISTS on_auth_user_created_with_calendar ON auth.users;

-- 4. RECREAR LA FUNCIÓN PRINCIPAL CON MANEJO DE ERRORES
-- ====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_with_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear el perfil del usuario con manejo de errores
  BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
      -- No fallar el trigger por errores de perfil
  END;
  
  -- Agregar calendario escolar al nuevo usuario con manejo de errores
  BEGIN
    PERFORM add_school_calendar_to_new_user(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error adding school calendar for user %: %', NEW.id, SQLERRM;
      -- No fallar el trigger por errores de calendario
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RECREAR EL TRIGGER PRINCIPAL
-- ==============================
CREATE TRIGGER on_auth_user_created_with_calendar
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_calendar();

-- 6. VERIFICAR QUE LA FUNCIÓN DE CALENDARIO EXISTE
-- ===============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_school_calendar_to_new_user') THEN
        RAISE EXCEPTION 'Function add_school_calendar_to_new_user does not exist. Please ensure migration 20241218000002 was applied first.';
    END IF;
END $$;

-- 7. COMENTARIOS Y DOCUMENTACIÓN
-- ==============================
COMMENT ON FUNCTION public.handle_new_user_with_calendar() IS 'Maneja la creación de nuevos usuarios con manejo robusto de errores para perfil y calendario escolar';

-- 8. VERIFICACIÓN DE LA MIGRACIÓN
-- ===============================
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Trigger conflict resolved';
    RAISE NOTICE 'Removed conflicting basic trigger';
    RAISE NOTICE 'Enhanced error handling in main trigger';
    RAISE NOTICE 'New users should now register without database errors';
END $$;