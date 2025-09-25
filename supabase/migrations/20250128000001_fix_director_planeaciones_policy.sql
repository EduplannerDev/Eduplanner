-- Migración: Corregir política RLS de planeaciones para directores
-- =====================================================
-- Esta migración corrige la política RLS que permite a los directores
-- ver planeaciones de profesores de otros planteles

-- 1. CORREGIR POLÍTICA DE PLANEACIONES
-- =====================================================

-- Eliminar política problemática
DROP POLICY IF EXISTS "Usuarios pueden ver planeaciones según permisos" ON planeaciones;

-- Crear política corregida
CREATE POLICY "Usuarios pueden ver planeaciones según permisos" ON planeaciones
    FOR SELECT USING (
        user_id = auth.uid() -- El propio usuario puede ver sus planeaciones
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador' -- Administradores ven todas las planeaciones
        )
        OR EXISTS (
            SELECT 1 FROM profiles director
            JOIN profiles profesor ON profesor.id = planeaciones.user_id
            WHERE director.id = auth.uid()
            AND director.role = 'director'
            AND director.plantel_id = profesor.plantel_id -- Solo profesores del mismo plantel
            AND director.plantel_id IS NOT NULL -- El director debe tener un plantel asignado
            AND profesor.plantel_id IS NOT NULL -- El profesor debe tener un plantel asignado
        )
    );

-- 2. CORREGIR POLÍTICA DE PLANEACION_CREATIONS
-- =====================================================

-- Eliminar política problemática
DROP POLICY IF EXISTS "Usuarios pueden ver creaciones según permisos" ON planeacion_creations;

-- Crear política corregida
CREATE POLICY "Usuarios pueden ver creaciones según permisos" ON planeacion_creations
    FOR SELECT USING (
        user_id = auth.uid() -- El propio usuario puede ver sus creaciones
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador' -- Administradores ven todas las creaciones
        )
        OR EXISTS (
            SELECT 1 FROM profiles director
            JOIN profiles profesor ON profesor.id = planeacion_creations.user_id
            WHERE director.id = auth.uid()
            AND director.role = 'director'
            AND director.plantel_id = profesor.plantel_id -- Solo profesores del mismo plantel
            AND director.plantel_id IS NOT NULL -- El director debe tener un plantel asignado
            AND profesor.plantel_id IS NOT NULL -- El profesor debe tener un plantel asignado
        )
    );

-- 3. COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON POLICY "Usuarios pueden ver planeaciones según permisos" ON planeaciones IS 
'Política RLS corregida para planeaciones:
- Usuarios: pueden ver sus propias planeaciones
- Administradores: pueden ver todas las planeaciones
- Directores: pueden ver SOLO planeaciones de profesores de su mismo plantel (usando JOIN en lugar de CROSS JOIN)';

COMMENT ON POLICY "Usuarios pueden ver creaciones según permisos" ON planeacion_creations IS 
'Política RLS corregida para planeacion_creations:
- Usuarios: pueden ver sus propias creaciones
- Administradores: pueden ver todas las creaciones
- Directores: pueden ver SOLO creaciones de profesores de su mismo plantel (usando JOIN en lugar de CROSS JOIN)';