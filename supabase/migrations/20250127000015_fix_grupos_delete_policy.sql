-- Migración: Corregir política RLS para permitir que profesores eliminen sus propios grupos
-- =====================================================
-- Esta migración corrige la política RLS de DELETE para grupos
-- para permitir que profesores eliminen sus propios grupos

-- 1. CORREGIR POLÍTICA RLS PARA ELIMINAR GRUPOS
-- =====================================================
-- Eliminar política existente
DROP POLICY IF EXISTS "Eliminar grupos según rol" ON grupos;

-- Crear política corregida para eliminar grupos
-- Permite a profesores eliminar sus propios grupos
CREATE POLICY "Eliminar grupos según rol" ON grupos
  FOR DELETE USING (
    user_id = auth.uid() -- El profesor propietario puede eliminar sus grupos
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador' -- Administradores pueden eliminar cualquier grupo
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id) -- Directores pueden eliminar grupos de su plantel
      )
    )
  );

-- 2. COMENTARIOS PARA DOCUMENTAR EL CAMBIO
-- =====================================================
COMMENT ON POLICY "Eliminar grupos según rol" ON grupos IS 
'Política RLS para eliminar grupos:
- Profesores: pueden eliminar sus propios grupos (user_id = auth.uid())
- Directores: pueden eliminar grupos de su plantel
- Administradores: pueden eliminar cualquier grupo';