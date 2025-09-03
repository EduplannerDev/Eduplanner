-- Migración: Corregir política de inserción para parent_messages
-- =====================================================
-- Esta migración corrige la política de inserción para parent_messages
-- para permitir que los profesores creen mensajes para alumnos de su plantel

-- Eliminar política de inserción existente
DROP POLICY IF EXISTS "Crear mensajes según permisos" ON parent_messages;

-- Crear nueva política de inserción más permisiva
CREATE POLICY "Crear mensajes según permisos" ON parent_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND (
            -- Administradores pueden crear cualquier mensaje
            EXISTS (
                SELECT 1 FROM profiles p 
                WHERE p.id = auth.uid() 
                AND p.role = 'administrador'
            )
            OR
            -- Directores pueden crear mensajes para alumnos de su plantel
            EXISTS (
                SELECT 1 FROM alumnos a
                JOIN grupos g ON g.id = a.grupo_id
                JOIN profiles p ON p.id = auth.uid()
                WHERE a.id = parent_messages.alumno_id
                AND p.role = 'director' 
                AND p.plantel_id = g.plantel_id
            )
            OR
            -- Profesores pueden crear mensajes para alumnos de su plantel
            EXISTS (
                SELECT 1 FROM alumnos a
                JOIN grupos g ON g.id = a.grupo_id
                JOIN profiles p ON p.id = auth.uid()
                WHERE a.id = parent_messages.alumno_id
                AND p.role = 'profesor' 
                AND p.plantel_id = g.plantel_id
            )
        )
    );

-- Comentarios
-- =====================================================
-- Esta política permite:
-- 1. Administradores: crear cualquier mensaje
-- 2. Directores: crear mensajes para alumnos de su plantel
-- 3. Profesores: crear mensajes (se valida que tengan plantel_id)
-- La validación específica del alumno se hace en el código de la aplicación