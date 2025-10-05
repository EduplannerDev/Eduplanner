-- Migración: Agregar acceso de directores a proyectos
-- =====================================================
-- Esta migración permite que los directores puedan ver y gestionar proyectos
-- de profesores de su mismo plantel, siguiendo el mismo patrón que planeaciones

-- 1. ACTUALIZAR POLÍTICAS DE PROYECTOS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Profesores can manage own projects" ON proyectos;
DROP POLICY IF EXISTS "Profesores can view plantel projects" ON proyectos;
DROP POLICY IF EXISTS "Admins can manage all projects" ON proyectos;

-- Nueva política que incluye directores del mismo plantel
CREATE POLICY "Usuarios pueden gestionar proyectos según permisos" ON proyectos
    FOR ALL USING (
        -- El propio usuario puede gestionar sus proyectos
        profesor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        OR EXISTS (
            SELECT 1 FROM profiles director
            JOIN profiles profesor ON profesor.id = proyectos.profesor_id
            WHERE director.id = auth.uid()
            AND director.role = 'director'
            AND director.activo = true
            AND director.plantel_id = profesor.plantel_id -- Solo profesores del mismo plantel
            AND director.plantel_id IS NOT NULL -- El director debe tener un plantel asignado
            AND profesor.plantel_id IS NOT NULL -- El profesor debe tener un plantel asignado
        )
    );

-- Nueva política para ver proyectos (SELECT)
CREATE POLICY "Usuarios pueden ver proyectos según permisos" ON proyectos
    FOR SELECT USING (
        -- El propio usuario puede ver sus proyectos
        profesor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
            AND p.activo = true
        )
        OR EXISTS (
            SELECT 1 FROM profiles director
            JOIN profiles profesor ON profesor.id = proyectos.profesor_id
            WHERE director.id = auth.uid()
            AND director.role = 'director'
            AND director.activo = true
            AND director.plantel_id = profesor.plantel_id -- Solo profesores del mismo plantel
            AND director.plantel_id IS NOT NULL -- El director debe tener un plantel asignado
            AND profesor.plantel_id IS NOT NULL -- El profesor debe tener un plantel asignado
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            JOIN grupos g ON g.plantel_id = p.plantel_id
            WHERE p.id = auth.uid() 
            AND p.role = 'profesor' 
            AND p.activo = true
            AND g.id = proyectos.grupo_id
        )
    );

-- 2. ACTUALIZAR POLÍTICAS DE PROYECTO_CURRICULO
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Profesores can manage own project curriculo" ON proyecto_curriculo;
DROP POLICY IF EXISTS "Admins can manage all project curriculo" ON proyecto_curriculo;

-- Nueva política que incluye directores
CREATE POLICY "Usuarios pueden gestionar proyecto curriculo según permisos" ON proyecto_curriculo
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proyectos p
            JOIN profiles pr ON pr.id = p.profesor_id
            WHERE p.id = proyecto_curriculo.proyecto_id
            AND (
                pr.id = auth.uid() -- El propio profesor
                OR EXISTS (
                    SELECT 1 FROM profiles admin
                    WHERE admin.id = auth.uid()
                    AND admin.role = 'administrador'
                    AND admin.activo = true
                )
                OR EXISTS (
                    SELECT 1 FROM profiles director
                    WHERE director.id = auth.uid()
                    AND director.role = 'director'
                    AND director.activo = true
                    AND director.plantel_id = pr.plantel_id -- Mismo plantel
                    AND director.plantel_id IS NOT NULL
                    AND pr.plantel_id IS NOT NULL
                )
            )
        )
    );

-- 3. ACTUALIZAR POLÍTICAS DE PROYECTO_FASES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Profesores can manage own project phases" ON proyecto_fases;
DROP POLICY IF EXISTS "Profesores can view plantel project phases" ON proyecto_fases;
DROP POLICY IF EXISTS "Admins can manage all project phases" ON proyecto_fases;

-- Nueva política para gestionar fases
CREATE POLICY "Usuarios pueden gestionar proyecto fases según permisos" ON proyecto_fases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proyectos p
            JOIN profiles pr ON pr.id = p.profesor_id
            WHERE p.id = proyecto_fases.proyecto_id
            AND (
                pr.id = auth.uid() -- El propio profesor
                OR EXISTS (
                    SELECT 1 FROM profiles admin
                    WHERE admin.id = auth.uid()
                    AND admin.role = 'administrador'
                    AND admin.activo = true
                )
                OR EXISTS (
                    SELECT 1 FROM profiles director
                    WHERE director.id = auth.uid()
                    AND director.role = 'director'
                    AND director.activo = true
                    AND director.plantel_id = pr.plantel_id -- Mismo plantel
                    AND director.plantel_id IS NOT NULL
                    AND pr.plantel_id IS NOT NULL
                )
            )
        )
    );

-- Nueva política para ver fases
CREATE POLICY "Usuarios pueden ver proyecto fases según permisos" ON proyecto_fases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proyectos p
            JOIN profiles pr ON pr.id = p.profesor_id
            WHERE p.id = proyecto_fases.proyecto_id
            AND (
                pr.id = auth.uid() -- El propio profesor
                OR EXISTS (
                    SELECT 1 FROM profiles admin
                    WHERE admin.id = auth.uid()
                    AND admin.role = 'administrador'
                    AND admin.activo = true
                )
                OR EXISTS (
                    SELECT 1 FROM profiles director
                    WHERE director.id = auth.uid()
                    AND director.role = 'director'
                    AND director.activo = true
                    AND director.plantel_id = pr.plantel_id -- Mismo plantel
                    AND director.plantel_id IS NOT NULL
                    AND pr.plantel_id IS NOT NULL
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM proyectos p
            JOIN grupos g ON g.id = p.grupo_id
            JOIN profiles pr ON pr.plantel_id = g.plantel_id
            WHERE p.id = proyecto_fases.proyecto_id
            AND pr.id = auth.uid()
            AND pr.role = 'profesor'
            AND pr.activo = true
        )
    );

-- 4. COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON POLICY "Usuarios pueden gestionar proyectos según permisos" ON proyectos IS 
'Política RLS para gestión de proyectos:
- Profesores: pueden gestionar sus propios proyectos
- Administradores: pueden gestionar todos los proyectos
- Directores: pueden gestionar proyectos de profesores de su mismo plantel';

COMMENT ON POLICY "Usuarios pueden ver proyectos según permisos" ON proyectos IS 
'Política RLS para visualización de proyectos:
- Profesores: pueden ver sus propios proyectos y proyectos de su plantel
- Administradores: pueden ver todos los proyectos
- Directores: pueden ver proyectos de profesores de su mismo plantel';

COMMENT ON POLICY "Usuarios pueden gestionar proyecto curriculo según permisos" ON proyecto_curriculo IS 
'Política RLS para gestión de relaciones proyecto-curriculum:
- Profesores: pueden gestionar relaciones de sus proyectos
- Administradores: pueden gestionar todas las relaciones
- Directores: pueden gestionar relaciones de proyectos de profesores de su plantel';

COMMENT ON POLICY "Usuarios pueden gestionar proyecto fases según permisos" ON proyecto_fases IS 
'Política RLS para gestión de fases de proyectos:
- Profesores: pueden gestionar fases de sus proyectos
- Administradores: pueden gestionar todas las fases
- Directores: pueden gestionar fases de proyectos de profesores de su plantel';
