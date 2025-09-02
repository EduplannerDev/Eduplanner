-- Migración: Corregir trigger para asegurar que el calendario se carga correctamente
-- ==========================================================================
-- Esta migración corrige el problema donde los errores del calendario se capturan
-- silenciosamente, impidiendo que los nuevos usuarios reciban el calendario escolar

-- 1. RECREAR LA FUNCIÓN PRINCIPAL SIN CAPTURAR ERRORES DE CALENDARIO
-- =================================================================
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
  
  -- Agregar calendario escolar al nuevo usuario SIN capturar errores
  -- Si falla, debe fallar todo el trigger para detectar el problema
  PERFORM add_school_calendar_to_new_user(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. VERIFICAR QUE LA FUNCIÓN DE CALENDARIO EXISTE
-- ===============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_school_calendar_to_new_user') THEN
        RAISE EXCEPTION 'Function add_school_calendar_to_new_user does not exist. Please ensure migration 20241218000002 was applied first.';
    END IF;
    
    RAISE NOTICE 'Function add_school_calendar_to_new_user exists and is ready';
END $$;

-- 3. COMENTARIOS Y DOCUMENTACIÓN
-- ==============================
COMMENT ON FUNCTION public.handle_new_user_with_calendar() IS 'Maneja la creación de nuevos usuarios. Permite errores de perfil pero requiere éxito en calendario escolar';

-- 4. VERIFICACIÓN DE LA MIGRACIÓN
-- ===============================
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Calendar trigger fixed';
    RAISE NOTICE 'Profile creation errors are caught and logged';
    RAISE NOTICE 'Calendar creation errors will now cause trigger failure for debugging';
    RAISE NOTICE 'New users should receive school calendar or registration will fail with clear error';
END $$;