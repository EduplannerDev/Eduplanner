-- Migración: Arreglar políticas RLS para acceso de directores
-- =====================================================
-- Esta migración permite que los directores accedan a los datos de profesores de su plantel

-- 1. ACTUALIZAR POLÍTICAS DE PLANEACION_CREATIONS
-- =====================================================

-- Eliminar política existente de administradores
DROP POLICY IF EXISTS "Administradores pueden ver todas las creaciones" ON planeacion_creations;

-- Eliminar política existente de usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias creaciones" ON planeacion_creations;

-- Nueva política que incluye directores del mismo plantel
CREATE POLICY "Usuarios pueden ver creaciones según permisos" ON planeacion_creations
    FOR SELECT USING (
        user_id = auth.uid() -- El propio usuario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador' -- Administradores ven todo
        )
        OR EXISTS (
            SELECT 1 FROM profiles director, profiles profesor
            WHERE director.id = auth.uid()
            AND director.role = 'director'
            AND profesor.id = planeacion_creations.user_id
            AND profesor.plantel_id = director.plantel_id -- Mismo plantel
        )
    );

-- 2. ACTUALIZAR POLÍTICAS DE PLANEACIONES
-- =====================================================

-- Eliminar política existente
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias planeaciones" ON planeaciones;

-- Nueva política que incluye directores del mismo plantel
CREATE POLICY "Usuarios pueden ver planeaciones según permisos" ON planeaciones
    FOR SELECT USING (
        user_id = auth.uid() -- El propio usuario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador' -- Administradores ven todo
        )
        OR EXISTS (
            SELECT 1 FROM profiles director, profiles profesor
            WHERE director.id = auth.uid()
            AND director.role = 'director'
            AND profesor.id = planeaciones.user_id
            AND profesor.plantel_id = director.plantel_id -- Mismo plantel
        )
    );

-- 3. ACTUALIZAR POLÍTICAS DE PROFILES PARA DIRECTORES
-- =====================================================

-- Verificar si existe la política y eliminarla si es necesario
DROP POLICY IF EXISTS "Directores pueden ver profesores de su plantel" ON profiles;

-- Nueva política para que directores puedan ver profesores de su plantel
CREATE POLICY "Directores pueden ver profesores de su plantel" ON profiles
    FOR SELECT USING (
        id = auth.uid() -- El propio usuario
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador' -- Administradores ven todo
        )
        OR EXISTS (
            SELECT 1 FROM profiles director
            WHERE director.id = auth.uid()
            AND director.role = 'director'
            AND director.plantel_id = profiles.plantel_id -- Mismo plantel
        )
    );

-- 4. COMENTARIOS
-- =====================================================
COMMENT ON POLICY "Usuarios pueden ver creaciones según permisos" ON planeacion_creations IS 'Permite a usuarios ver sus creaciones, administradores ver todo, y directores ver creaciones de profesores de su plantel';
COMMENT ON POLICY "Usuarios pueden ver planeaciones según permisos" ON planeaciones IS 'Permite a usuarios ver sus planeaciones, administradores ver todo, y directores ver planeaciones de profesores de su plantel';
COMMENT ON POLICY "Directores pueden ver profesores de su plantel" ON profiles IS 'Permite a directores ver los perfiles de profesores de su plantel';