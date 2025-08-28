-- Migración: Corregir sistema de invitaciones
-- =====================================================
-- Esta migración corrige el sistema de invitaciones para que procese
-- correctamente los metadatos de invitación y asigne usuarios a planteles

-- 1. ACTUALIZAR FUNCIÓN PARA MANEJAR NUEVOS USUARIOS CON INVITACIONES
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  plantel_id_meta UUID;
  invited_by_meta UUID;
BEGIN
  -- Extraer metadatos de invitación si existen
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'profesor');
  plantel_id_meta := (NEW.raw_user_meta_data->>'plantel_id')::UUID;
  invited_by_meta := (NEW.raw_user_meta_data->>'invited_by')::UUID;

  -- Crear perfil del usuario
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    role, 
    activo,
    subscription_plan
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email,
    user_role::user_role, -- Usar rol de invitación o por defecto
    true, -- Activo por defecto
    'free' -- Plan gratuito por defecto
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar errores si ya existe

  -- Si hay metadatos de invitación, crear asignación al plantel
  IF plantel_id_meta IS NOT NULL THEN
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CREAR FUNCIÓN PARA VERIFICAR ESTADO DE INVITACIÓN
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_invitation_status(user_id_param UUID)
RETURNS TABLE(
  has_invitations BOOLEAN,
  plantel_count INTEGER,
  primary_plantel_id UUID,
  primary_plantel_name TEXT,
  primary_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN COUNT(upa.id) > 0 THEN true ELSE false END as has_invitations,
    COUNT(upa.id)::INTEGER as plantel_count,
    (SELECT upa2.plantel_id FROM user_plantel_assignments upa2 
     WHERE upa2.user_id = user_id_param AND upa2.activo = true 
     ORDER BY upa2.assigned_at ASC LIMIT 1) as primary_plantel_id,
    (SELECT p.nombre FROM user_plantel_assignments upa3 
     JOIN planteles p ON p.id = upa3.plantel_id
     WHERE upa3.user_id = user_id_param AND upa3.activo = true 
     ORDER BY upa3.assigned_at ASC LIMIT 1) as primary_plantel_name,
    (SELECT upa4.role::TEXT FROM user_plantel_assignments upa4 
     WHERE upa4.user_id = user_id_param AND upa4.activo = true 
     ORDER BY upa4.assigned_at ASC LIMIT 1) as primary_role
  FROM user_plantel_assignments upa
  WHERE upa.user_id = user_id_param AND upa.activo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CONFIGURAR PERMISOS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.check_invitation_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 4. COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION public.handle_new_user() IS 'Maneja la creación de nuevos usuarios y procesa metadatos de invitación';
COMMENT ON FUNCTION public.check_invitation_status(UUID) IS 'Verifica el estado de invitaciones de un usuario';

-- 5. VERIFICAR QUE EL TRIGGER ESTÉ ACTIVO
-- =====================================================
-- El trigger ya existe, solo verificamos que esté activo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    -- Recrear el trigger si no existe
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;