-- Migración: Configurar Row Level Security (RLS)
-- =====================================================
-- Esta migración establece las políticas de seguridad a nivel de fila
-- para controlar el acceso a los datos según roles y planteles

-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================
ALTER TABLE planteles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plantel_assignments ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS RLS PARA PLANTELES
-- =====================================================
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Ver planteles según rol" ON planteles;
DROP POLICY IF EXISTS "Solo administradores pueden gestionar planteles" ON planteles;

-- Política para ver planteles
CREATE POLICY "Ver planteles según rol" ON planteles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador' 
        OR p.plantel_id = planteles.id
      )
    )
  );

-- Política para gestionar planteles
CREATE POLICY "Solo administradores pueden gestionar planteles" ON planteles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'administrador'
    )
  );

-- 3. POLÍTICAS RLS PARA PROFILES
-- =====================================================
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles según su rol" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar perfiles según su rol" ON profiles;
DROP POLICY IF EXISTS "Crear perfiles según rol" ON profiles;

-- Crear nuevas políticas
CREATE POLICY "Usuarios pueden ver perfiles según su rol" ON profiles
  FOR SELECT USING (
    id = auth.uid()
  );

CREATE POLICY "Usuarios pueden actualizar perfiles según su rol" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
  );

CREATE POLICY "Crear perfiles según rol" ON profiles
  FOR INSERT WITH CHECK (
    id = auth.uid() -- Usuarios pueden crear su propio perfil
  );

-- 4. POLÍTICAS RLS PARA GRUPOS
-- =====================================================
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own grupos" ON grupos;
DROP POLICY IF EXISTS "Users can insert own grupos" ON grupos;
DROP POLICY IF EXISTS "Users can update own grupos" ON grupos;
DROP POLICY IF EXISTS "Users can delete own grupos" ON grupos;
DROP POLICY IF EXISTS "Ver grupos según rol y plantel" ON grupos;
DROP POLICY IF EXISTS "Crear grupos según rol y plantel" ON grupos;
DROP POLICY IF EXISTS "Actualizar grupos según rol y plantel" ON grupos;
DROP POLICY IF EXISTS "Eliminar grupos según rol" ON grupos;

-- Crear nuevas políticas para grupos
CREATE POLICY "Ver grupos según rol y plantel" ON grupos
  FOR SELECT USING (
    user_id = auth.uid() -- El profesor propietario
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id)
      )
    )
  );

CREATE POLICY "Crear grupos según rol y plantel" ON grupos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role IN ('director', 'profesor') AND p.plantel_id = grupos.plantel_id)
      )
    )
  );

CREATE POLICY "Actualizar grupos según rol y plantel" ON grupos
  FOR UPDATE USING (
    user_id = auth.uid() -- El profesor propietario
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id)
      )
    )
  );

CREATE POLICY "Eliminar grupos según rol" ON grupos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id)
      )
    )
  );

-- 5. POLÍTICAS RLS PARA ASIGNACIONES
-- =====================================================
CREATE POLICY "Ver asignaciones según rol" ON user_plantel_assignments
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = user_plantel_assignments.plantel_id)
      )
    )
  );

CREATE POLICY "Gestionar asignaciones según rol" ON user_plantel_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = user_plantel_assignments.plantel_id)
      )
    )
  );