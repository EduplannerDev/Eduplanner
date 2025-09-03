-- Migración para corregir las políticas RLS de parent_messages
-- Esta migración soluciona el problema donde los directores no pueden guardar mensajes para estudiantes

-- Primero, eliminamos la política existente
DROP POLICY IF EXISTS "Crear mensajes de padres según permisos" ON parent_messages;

-- Creamos una nueva política más permisiva que funcione correctamente
CREATE POLICY "Crear mensajes de padres según permisos" ON parent_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('profesor', 'director', 'administrador')
        )
        AND (
            -- Para mensajes individuales - política más permisiva
            alumno_id IS NOT NULL AND (
                -- Administradores pueden enviar a cualquier estudiante
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid() AND p.role = 'administrador'
                )
                OR
                -- Directores pueden enviar a estudiantes de su plantel
                EXISTS (
                    SELECT 1 FROM alumnos a
                    JOIN grupos g ON g.id = a.grupo_id
                    JOIN profiles p ON p.id = auth.uid()
                    WHERE a.id = parent_messages.alumno_id
                    AND p.role = 'director' 
                    AND p.plantel_id = g.plantel_id
                )
                OR
                -- Profesores pueden enviar a estudiantes de sus grupos
                EXISTS (
                    SELECT 1 FROM alumnos a
                    JOIN grupos g ON g.id = a.grupo_id
                    WHERE a.id = parent_messages.alumno_id
                    AND g.user_id = auth.uid()
                )
            )
        )
    );

-- También necesitamos asegurar que la política de SELECT en alumnos permita a los directores ver estudiantes
-- Verificamos si existe la política y la actualizamos si es necesario
DROP POLICY IF EXISTS "Ver alumnos según rol y plantel" ON alumnos;

CREATE POLICY "Ver alumnos según rol y plantel" ON alumnos
    FOR SELECT USING (
        -- Administradores pueden ver todos los alumnos
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'administrador'
        )
        OR
        -- Directores pueden ver alumnos de su plantel
        EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND p.role = 'director' 
            AND p.plantel_id = g.plantel_id
        )
        OR
        -- Profesores pueden ver alumnos de sus grupos
        EXISTS (
            SELECT 1 FROM grupos g
            WHERE g.id = alumnos.grupo_id
            AND g.user_id = auth.uid()
        )
        OR
        -- Propietario directo (si existe)
        user_id = auth.uid()
    );

-- Comentario explicativo
COMMENT ON POLICY "Crear mensajes de padres según permisos" ON parent_messages IS 
'Política actualizada para permitir que directores, profesores y administradores creen mensajes para padres según sus permisos de acceso a estudiantes y grupos';

COMMENT ON POLICY "Ver alumnos según rol y plantel" ON alumnos IS 
'Política actualizada para permitir que directores vean estudiantes de su plantel, profesores vean estudiantes de sus grupos, y administradores vean todos los estudiantes';