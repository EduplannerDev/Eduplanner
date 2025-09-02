-- Migración: Eliminar trigger automático de calendario escolar
-- =========================================================
-- Esta migración elimina el trigger automático que causaba problemas
-- y permite que los usuarios generen manualmente los eventos SEP

-- 1. ELIMINAR TRIGGER AUTOMÁTICO
-- =============================
DROP TRIGGER IF EXISTS on_auth_user_created_with_calendar ON auth.users;

-- 2. CREAR FUNCIÓN BÁSICA PARA NUEVOS USUARIOS (SIN CALENDARIO)
-- ===========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_basic()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear el perfil del usuario
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

-- 3. CREAR TRIGGER BÁSICO
-- ======================
CREATE TRIGGER on_auth_user_created_basic
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_basic();

-- 4. MANTENER LA FUNCIÓN DE CALENDARIO PARA USO MANUAL
-- ===================================================
-- La función add_school_calendar_to_new_user se mantiene para uso manual

-- 5. COMENTARIOS Y DOCUMENTACIÓN
-- ==============================
COMMENT ON FUNCTION public.handle_new_user_basic() IS 'Maneja la creación básica de nuevos usuarios sin calendario automático';
-- Nota: La función add_school_calendar_to_new_user se mantiene disponible para uso manual si existe

-- 6. VERIFICACIÓN DE LA MIGRACIÓN
-- ===============================
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Automatic calendar trigger removed';
    RAISE NOTICE 'New users will only get basic profile creation';
    RAISE NOTICE 'Calendar events can be generated manually from the UI';
    RAISE NOTICE 'Function add_school_calendar_to_new_user is available for manual use';
END $$;