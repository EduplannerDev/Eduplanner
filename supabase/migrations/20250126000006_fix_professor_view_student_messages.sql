-- Migración: Corregir política RLS para que profesores vean mensajes de sus alumnos
-- =====================================================
-- Esta migración corrige la política para que los profesores puedan ver
-- los mensajes creados para alumnos de sus grupos

-- Eliminar la política SELECT existente
DROP POLICY IF EXISTS "parent_messages_select_policy" ON parent_messages;

-- Crear nueva política SELECT corregida
CREATE POLICY "parent_messages_select_policy" ON parent_messages
    FOR SELECT USING (
        -- El usuario que creó el mensaje puede verlo
        user_id = auth.uid()
        OR
        -- Administradores pueden ver todos los mensajes
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'administrador'
        )
        OR
        -- Directores pueden ver mensajes de alumnos de su plantel
        EXISTS (
            SELECT 1 FROM alumnos a
            JOIN grupos g ON g.id = a.grupo_id
            JOIN profiles p ON p.id = auth.uid()
            WHERE a.id = parent_messages.alumno_id
            AND p.role = 'director'
            AND p.plantel_id = g.plantel_id
        )
        OR
        -- CORREGIDO: Profesores pueden ver mensajes de alumnos de sus grupos
        -- Y también mensajes de alumnos de su mismo plantel
        EXISTS (
            SELECT 1 FROM alumnos a
            JOIN grupos g ON g.id = a.grupo_id
            JOIN profiles p ON p.id = auth.uid()
            WHERE a.id = parent_messages.alumno_id
            AND p.role = 'profesor'
            AND (
                g.user_id = auth.uid()  -- Alumnos de sus grupos
                OR p.plantel_id = g.plantel_id  -- Alumnos del mismo plantel
            )
        )
    );

-- Comentarios
-- =====================================================
COMMENT ON POLICY "parent_messages_select_policy" ON parent_messages IS 
'Permite ver mensajes al creador, administradores, directores (alumnos de su plantel), profesores (alumnos de sus grupos) y alumnos (sus propios mensajes)';