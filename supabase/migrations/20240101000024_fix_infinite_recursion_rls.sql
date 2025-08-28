-- Migración: Corregir recursión infinita en políticas RLS
-- =====================================================
-- Esta migración corrige el problema de recursión infinita causado por las políticas
-- RLS que consultan la misma tabla profiles para verificar permisos de administrador

-- 1. ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- 2. CREAR FUNCIÓN PARA VERIFICAR ROLES SIN RECURSIÓN
-- =====================================================
-- Esta función usa SECURITY DEFINER para evitar las políticas RLS
CREATE OR REPLACE FUNCTION check_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Usar SECURITY DEFINER para evitar políticas RLS
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id AND activo = true;
  
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR POLÍTICAS CORREGIDAS SIN RECURSIÓN
-- =====================================================

-- Política para que administradores y directores puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    -- Los usuarios pueden ver su propio perfil
    auth.uid() = id
    OR
    -- O si el usuario actual es administrador o director
    check_user_role(auth.uid()) IN ('administrador', 'director')
  );

-- Política para actualización de perfiles
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    -- El usuario puede actualizar su propio perfil
    auth.uid() = id
    OR
    -- O es un administrador/director
    check_user_role(auth.uid()) IN ('administrador', 'director')
  );

-- 4. ACTUALIZAR FUNCIÓN is_admin_or_director PARA EVITAR RECURSIÓN
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin_or_director(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_user_role(user_id) IN ('administrador', 'director');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CONFIGURAR PERMISOS
-- =====================================================
GRANT EXECUTE ON FUNCTION check_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_role(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION is_admin_or_director(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_director(UUID) TO service_role;

-- 6. COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION check_user_role(UUID) IS 'Verifica el rol de un usuario sin causar recursión RLS';
COMMENT ON FUNCTION is_admin_or_director(UUID) IS 'Verifica si un usuario es administrador o director sin recursión';
COMMENT ON POLICY "Admins can view all profiles" ON profiles IS 'Permite a usuarios ver su perfil y a admins/directores ver todos los perfiles';
COMMENT ON POLICY "Admins can update profiles" ON profiles IS 'Permite actualizar perfiles propios o por administradores';

-- 7. VERIFICACIÓN
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migración completada: Recursión infinita en políticas RLS corregida';
  RAISE NOTICE 'Función check_user_role() creada con SECURITY DEFINER';
  RAISE NOTICE 'Políticas RLS actualizadas sin recursión';
  RAISE NOTICE 'Los administradores pueden buscar usuarios sin errores de recursión';
END $$;