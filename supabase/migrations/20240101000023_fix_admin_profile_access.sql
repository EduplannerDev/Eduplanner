-- Migración: Permitir acceso de administradores a perfiles para búsqueda de usuarios
-- =====================================================
-- Esta migración agrega políticas RLS que permiten a administradores y directores
-- ver todos los perfiles para poder buscar y asignar usuarios a planteles

-- 1. AGREGAR POLÍTICA PARA ADMINISTRADORES
-- =====================================================

-- Política para que administradores y directores puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('administrador', 'director')
      AND p.activo = true
    )
  );

-- 2. AGREGAR POLÍTICA PARA ACTUALIZACIÓN POR ADMINISTRADORES
-- =====================================================

-- Política para que administradores puedan actualizar perfiles de otros usuarios
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    -- El usuario puede actualizar su propio perfil
    auth.uid() = id
    OR
    -- O es un administrador/director activo
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('administrador', 'director')
      AND p.activo = true
    )
  );

-- 3. FUNCIÓN AUXILIAR PARA VERIFICAR PERMISOS DE ADMINISTRADOR
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin_or_director(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('administrador', 'director')
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POLÍTICA MEJORADA PARA USER_PLANTEL_ASSIGNMENTS
-- =====================================================

-- Verificar si la tabla user_plantel_assignments existe y agregar políticas si es necesario
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_plantel_assignments') THEN
    -- Habilitar RLS si no está habilitado
    ALTER TABLE user_plantel_assignments ENABLE ROW LEVEL SECURITY;
    
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "Users can view their assignments" ON user_plantel_assignments;
    DROP POLICY IF EXISTS "Admins can view all assignments" ON user_plantel_assignments;
    DROP POLICY IF EXISTS "Admins can manage assignments" ON user_plantel_assignments;
    
    -- Política para que usuarios vean sus propias asignaciones
    CREATE POLICY "Users can view their assignments" ON user_plantel_assignments
      FOR SELECT USING (auth.uid() = user_id);
    
    -- Política para que administradores vean todas las asignaciones
    CREATE POLICY "Admins can view all assignments" ON user_plantel_assignments
      FOR SELECT USING (is_admin_or_director());
    
    -- Política para que administradores gestionen asignaciones
    CREATE POLICY "Admins can manage assignments" ON user_plantel_assignments
      FOR ALL USING (is_admin_or_director());
      
    RAISE NOTICE 'Políticas RLS actualizadas para user_plantel_assignments';
  ELSE
    RAISE NOTICE 'Tabla user_plantel_assignments no existe, saltando configuración';
  END IF;
END $$;

-- 5. POLÍTICA PARA PLANTELES (SI EXISTE)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planteles') THEN
    -- Habilitar RLS si no está habilitado
    ALTER TABLE planteles ENABLE ROW LEVEL SECURITY;
    
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "Admins can view all planteles" ON planteles;
    DROP POLICY IF EXISTS "Admins can manage planteles" ON planteles;
    
    -- Política para que administradores vean todos los planteles
    CREATE POLICY "Admins can view all planteles" ON planteles
      FOR SELECT USING (is_admin_or_director());
    
    -- Política para que administradores gestionen planteles
    CREATE POLICY "Admins can manage planteles" ON planteles
      FOR ALL USING (is_admin_or_director());
      
    RAISE NOTICE 'Políticas RLS actualizadas para planteles';
  ELSE
    RAISE NOTICE 'Tabla planteles no existe, saltando configuración';
  END IF;
END $$;

-- 6. CONFIGURAR PERMISOS
-- =====================================================
GRANT EXECUTE ON FUNCTION is_admin_or_director(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_director(UUID) TO service_role;

-- 7. COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION is_admin_or_director(UUID) IS 'Verifica si un usuario tiene permisos de administrador o director';
COMMENT ON POLICY "Admins can view all profiles" ON profiles IS 'Permite a administradores y directores ver todos los perfiles para búsqueda de usuarios';
COMMENT ON POLICY "Admins can update profiles" ON profiles IS 'Permite a administradores actualizar perfiles de otros usuarios';

-- 8. VERIFICACIÓN
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migración completada: Acceso de administradores a perfiles configurado';
  RAISE NOTICE 'Políticas RLS agregadas para administradores y directores';
  RAISE NOTICE 'Función is_admin_or_director() creada';
  RAISE NOTICE 'Los administradores ahora pueden buscar y gestionar usuarios';
END $$;