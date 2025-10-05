-- Migración: Corregir políticas RLS para inserción en proyecto_recursos
-- =====================================================
-- Esta migración corrige las políticas RLS que están bloqueando la inserción de recursos

-- 1. ELIMINAR POLÍTICAS EXISTENTES
-- =====================================================
DROP POLICY IF EXISTS "Usuarios pueden ver recursos de sus proyectos" ON proyecto_recursos;
DROP POLICY IF EXISTS "Usuarios pueden gestionar recursos de sus proyectos" ON proyecto_recursos;

-- 2. CREAR POLÍTICAS CORREGIDAS
-- =====================================================

-- Política para SELECT (ver recursos)
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

-- Política para INSERT (crear recursos)
CREATE POLICY "Usuarios pueden crear recursos en sus proyectos" ON proyecto_recursos
    FOR INSERT WITH CHECK (
        -- El profesor puede crear recursos en sus propios proyectos
        EXISTS (
            SELECT 1 FROM proyectos p
            WHERE p.id = proyecto_recursos.proyecto_id
            AND p.profesor_id = auth.uid()
        )
        -- Los administradores pueden crear recursos en cualquier proyecto
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        -- Los directores pueden crear recursos en proyectos de su plantel
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

-- Política para UPDATE (actualizar recursos)
CREATE POLICY "Usuarios pueden actualizar recursos de sus proyectos" ON proyecto_recursos
    FOR UPDATE USING (
        -- El profesor puede actualizar recursos de sus propios proyectos
        EXISTS (
            SELECT 1 FROM proyectos p
            WHERE p.id = proyecto_recursos.proyecto_id
            AND p.profesor_id = auth.uid()
        )
        -- Los administradores pueden actualizar cualquier recurso
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        -- Los directores pueden actualizar recursos de proyectos de su plantel
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

-- Política para DELETE (eliminar recursos)
CREATE POLICY "Usuarios pueden eliminar recursos de sus proyectos" ON proyecto_recursos
    FOR DELETE USING (
        -- El profesor puede eliminar recursos de sus propios proyectos
        EXISTS (
            SELECT 1 FROM proyectos p
            WHERE p.id = proyecto_recursos.proyecto_id
            AND p.profesor_id = auth.uid()
        )
        -- Los administradores pueden eliminar cualquier recurso
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        -- Los directores pueden eliminar recursos de proyectos de su plantel
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
'Política RLS para SELECT: Profesores ven sus recursos, administradores ven todo, directores ven recursos de su plantel';

COMMENT ON POLICY "Usuarios pueden crear recursos en sus proyectos" ON proyecto_recursos IS 
'Política RLS para INSERT: Profesores crean en sus proyectos, administradores crean en cualquier proyecto, directores crean en su plantel';

COMMENT ON POLICY "Usuarios pueden actualizar recursos de sus proyectos" ON proyecto_recursos IS 
'Política RLS para UPDATE: Profesores actualizan sus recursos, administradores actualizan cualquier recurso, directores actualizan recursos de su plantel';

COMMENT ON POLICY "Usuarios pueden eliminar recursos de sus proyectos" ON proyecto_recursos IS 
'Política RLS para DELETE: Profesores eliminan sus recursos, administradores eliminan cualquier recurso, directores eliminan recursos de su plantel';
