-- Migración: Corregir políticas RLS para proyecto_recursos
-- =====================================================
-- Esta migración corrige las políticas RLS que fallaron en la migración anterior

-- 1. ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================
DROP POLICY IF EXISTS "Usuarios pueden ver recursos de sus proyectos" ON proyecto_recursos;
DROP POLICY IF EXISTS "Usuarios pueden gestionar recursos de sus proyectos" ON proyecto_recursos;

-- 2. CREAR POLÍTICAS CORREGIDAS
-- =====================================================

-- Política para que usuarios puedan ver recursos de sus proyectos
CREATE POLICY "Usuarios pueden ver recursos de sus proyectos" ON proyecto_recursos
    FOR SELECT USING (
        -- El profesor puede ver recursos de sus propios proyectos
        EXISTS (
            SELECT 1 FROM proyectos p
            WHERE p.id = proyecto_recursos.proyecto_id
            AND p.profesor_id = auth.uid()
        )
        -- Los administradores pueden ver todos los recursos
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        -- Los directores pueden ver recursos de proyectos de su plantel
        OR EXISTS (
            SELECT 1 FROM proyectos p
            JOIN grupos g ON g.id = p.grupo_id
            JOIN profiles director ON director.plantel_id = g.plantel_id
            WHERE p.id = proyecto_recursos.proyecto_id
            AND director.id = auth.uid()
            AND director.role = 'director'
            AND director.activo = true
            AND director.plantel_id IS NOT NULL
            AND g.plantel_id IS NOT NULL
        )
    );

-- Política para que usuarios puedan gestionar recursos de sus proyectos
CREATE POLICY "Usuarios pueden gestionar recursos de sus proyectos" ON proyecto_recursos
    FOR ALL USING (
        -- El profesor puede gestionar recursos de sus propios proyectos
        EXISTS (
            SELECT 1 FROM proyectos p
            WHERE p.id = proyecto_recursos.proyecto_id
            AND p.profesor_id = auth.uid()
        )
        -- Los administradores pueden gestionar todos los recursos
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        -- Los directores pueden gestionar recursos de proyectos de su plantel
        OR EXISTS (
            SELECT 1 FROM proyectos p
            JOIN grupos g ON g.id = p.grupo_id
            JOIN profiles director ON director.plantel_id = g.plantel_id
            WHERE p.id = proyecto_recursos.proyecto_id
            AND director.id = auth.uid()
            AND director.role = 'director'
            AND director.activo = true
            AND director.plantel_id IS NOT NULL
            AND g.plantel_id IS NOT NULL
        )
    );

-- 3. COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON POLICY "Usuarios pueden ver recursos de sus proyectos" ON proyecto_recursos IS 
'Política RLS para visualización de recursos:
- Profesores: pueden ver recursos de sus propios proyectos
- Administradores: pueden ver todos los recursos
- Directores: pueden ver recursos de proyectos de profesores de su mismo plantel';

COMMENT ON POLICY "Usuarios pueden gestionar recursos de sus proyectos" ON proyecto_recursos IS 
'Política RLS para gestión de recursos:
- Profesores: pueden gestionar recursos de sus propios proyectos
- Administradores: pueden gestionar todos los recursos
- Directores: pueden gestionar recursos de proyectos de profesores de su mismo plantel';
