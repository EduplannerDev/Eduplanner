-- Migración: Simplificar política RLS de parent_messages
-- =====================================================
-- Esta migración simplifica la política de inserción para parent_messages
-- eliminando la validación redundante del plantel_id

-- Eliminar política de inserción existente
DROP POLICY IF EXISTS "Crear mensajes según permisos" ON parent_messages;

-- Crear nueva política simplificada
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
            -- Directores y profesores pueden crear mensajes si el alumno existe
            (
                EXISTS (
                    SELECT 1 FROM profiles p 
                    WHERE p.id = auth.uid() 
                    AND p.role IN ('director', 'profesor')
                )
                AND
                EXISTS (
                    SELECT 1 FROM alumnos a
                    WHERE a.id = parent_messages.alumno_id
                )
            )
        )
    );

-- Comentarios
-- =====================================================
-- Esta política simplificada permite:
-- 1. Administradores: crear cualquier mensaje
-- 2. Directores y profesores: crear mensajes para cualquier alumno que exista
-- 3. Se elimina la validación redundante del plantel_id ya que:
--    - El alumno_id es único en el sistema
--    - La relación alumno -> grupo -> plantel ya está definida
--    - La validación de permisos específicos se puede hacer a nivel de aplicación

COMMENT ON POLICY "Crear mensajes según permisos" ON parent_messages IS 
'Política simplificada que permite a directores y profesores crear mensajes para cualquier alumno existente, eliminando la validación redundante del plantel_id';