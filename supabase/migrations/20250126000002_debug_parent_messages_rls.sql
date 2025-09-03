-- Migración: Simplificar política RLS para parent_messages
-- =====================================================
-- Esta migración crea una política RLS más simple que funcione correctamente

-- Eliminar política existente
DROP POLICY IF EXISTS "Crear mensajes según permisos" ON parent_messages;

-- Crear nueva política simplificada
CREATE POLICY "Crear mensajes según permisos" ON parent_messages
    FOR INSERT WITH CHECK (
        -- Validar que user_id coincida con el usuario autenticado
        user_id = auth.uid()
        AND
        -- Validar que el usuario tenga un rol válido
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('administrador', 'director', 'profesor')
        )
        AND
        -- Si alumno_id no es NULL, debe existir en la tabla alumnos
        (
            parent_messages.alumno_id IS NULL
            OR
            EXISTS (
                SELECT 1 FROM alumnos a
                WHERE a.id = parent_messages.alumno_id
            )
        )
    );

-- Comentarios
-- =====================================================
-- Esta política permite:
-- 1. Usuarios con roles válidos (administrador, director, profesor)
-- 2. Crear mensajes con alumno_id NULL (mensajes generales)
-- 3. Crear mensajes para alumnos que existen en la tabla alumnos
-- 4. Elimina validaciones complejas de plantel que causaban problemas

COMMENT ON POLICY "Crear mensajes según permisos" ON parent_messages IS 
'Política simplificada que valida rol de usuario y existencia del alumno';