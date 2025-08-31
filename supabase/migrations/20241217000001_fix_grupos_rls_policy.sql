-- Migración: Corregir política RLS para creación de grupos
-- =====================================================
-- Esta migración corrige la política de creación de grupos para permitir
-- que profesores sin plantel asignado puedan crear grupos

-- 1. ELIMINAR POLÍTICA EXISTENTE
-- =====================================================
DROP POLICY IF EXISTS "Crear grupos según rol y plantel" ON grupos;

-- 2. CREAR NUEVA POLÍTICA CORREGIDA
-- =====================================================
CREATE POLICY "Crear grupos según rol y plantel" ON grupos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id)
        OR (p.role = 'profesor' AND (
          p.plantel_id = grupos.plantel_id 
          OR (p.plantel_id IS NULL AND grupos.plantel_id IS NULL)
        ))
      )
    )
  );

-- 3. COMENTARIO EXPLICATIVO
-- =====================================================
COMMENT ON POLICY "Crear grupos según rol y plantel" ON grupos IS 
'Permite a administradores crear cualquier grupo, a directores crear grupos en su plantel, y a profesores crear grupos en su plantel asignado o grupos sin plantel si no tienen plantel asignado';