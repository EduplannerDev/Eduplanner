-- Migración: Corregir política RLS para permitir crear grupos sin plantel
-- =====================================================
-- Esta migración corrige la política RLS de INSERT para grupos
-- para permitir que profesores sin plantel asignado puedan crear grupos

-- 1. CORREGIR POLÍTICA RLS PARA CREAR GRUPOS
-- =====================================================
-- Eliminar política existente
DROP POLICY IF EXISTS "Crear grupos según rol y plantel" ON grupos;

-- Crear política corregida para crear grupos
-- Permite a profesores crear grupos incluso sin plantel asignado
CREATE POLICY "Crear grupos según rol y plantel" ON grupos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador' -- Administradores pueden crear cualquier grupo
        OR (
          p.role IN ('director', 'profesor') 
          AND (
            -- Caso 1: Ambos tienen plantel y coinciden
            (p.plantel_id IS NOT NULL AND p.plantel_id = grupos.plantel_id)
            OR 
            -- Caso 2: Profesor sin plantel crea grupo sin plantel
            (p.role = 'profesor' AND p.plantel_id IS NULL AND grupos.plantel_id IS NULL)
          )
        )
      )
    )
  );

-- 2. COMENTARIOS PARA DOCUMENTAR EL CAMBIO
-- =====================================================
COMMENT ON POLICY "Crear grupos según rol y plantel" ON grupos IS 
'Política RLS para crear grupos:
- Administradores: pueden crear cualquier grupo
- Directores: pueden crear grupos de su plantel
- Profesores con plantel: pueden crear grupos de su plantel
- Profesores sin plantel: pueden crear grupos sin plantel (plantel_id = NULL)';