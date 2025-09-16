-- Migración: Corregir política RLS para que profesores solo vean sus propios grupos
-- =====================================================
-- Esta migración corrige la política RLS para que los profesores solo puedan ver
-- sus propios grupos, no todos los grupos del plantel

-- 1. CORREGIR POLÍTICA RLS PARA VER GRUPOS
-- =====================================================
-- Eliminar política existente
DROP POLICY IF EXISTS "Ver grupos según rol y plantel" ON grupos;

-- Crear política corregida para grupos
-- Los profesores solo pueden ver sus propios grupos
-- Los directores y administradores pueden ver todos los grupos del plantel
CREATE POLICY "Ver grupos según rol y plantel" ON grupos
  FOR SELECT USING (
    user_id = auth.uid() -- El profesor propietario puede ver sus grupos
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador' -- Administradores ven todos los grupos
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id) -- Directores ven grupos de su plantel
      )
    )
  );

-- 2. COMENTARIOS PARA DOCUMENTAR EL CAMBIO
-- =====================================================
COMMENT ON POLICY "Ver grupos según rol y plantel" ON grupos IS 
'Política RLS para ver grupos:
- Profesores: solo sus propios grupos (user_id = auth.uid())
- Directores: todos los grupos de su plantel
- Administradores: todos los grupos del sistema';