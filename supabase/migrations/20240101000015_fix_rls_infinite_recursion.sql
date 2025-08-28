-- Migración: Corregir recursión infinita en políticas RLS de profiles
-- =====================================================
-- Esta migración corrige las políticas RLS que causan recursión infinita
-- al consultar la misma tabla profiles dentro de sus propias políticas

-- 1. ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles según su rol" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar perfiles según su rol" ON profiles;
DROP POLICY IF EXISTS "Crear perfiles según rol" ON profiles;

-- 2. CREAR POLÍTICAS CORREGIDAS SIN RECURSIÓN
-- =====================================================

-- Política simplificada para ver perfiles (solo el propio perfil)
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles
  FOR SELECT USING (
    id = auth.uid()
  );

-- Política simplificada para actualizar perfiles (solo el propio perfil)
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
  );

-- Política simplificada para crear perfiles (solo el propio perfil)
CREATE POLICY "Usuarios pueden crear su propio perfil" ON profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
  );

-- 3. CREAR POLÍTICA ADICIONAL PARA ADMINISTRADORES
-- =====================================================
-- Nota: Para funcionalidades administrativas, se puede usar el rol service_role
-- o implementar funciones SECURITY DEFINER que bypassen RLS

-- Función para que administradores puedan ver todos los perfiles
CREATE OR REPLACE FUNCTION get_all_profiles_admin()
RETURNS SETOF profiles AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Obtener el rol del usuario actual desde auth.users
    SELECT raw_user_meta_data->>'role' INTO current_user_role
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Si es administrador, devolver todos los perfiles
    IF current_user_role = 'administrador' THEN
        RETURN QUERY SELECT * FROM profiles;
    ELSE
        -- Si no es administrador, solo devolver su propio perfil
        RETURN QUERY SELECT * FROM profiles WHERE id = auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos a la función
GRANT EXECUTE ON FUNCTION get_all_profiles_admin() TO authenticated;