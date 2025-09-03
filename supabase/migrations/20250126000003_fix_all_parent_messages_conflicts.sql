-- Migración: Resolver TODOS los conflictos de políticas RLS en parent_messages
-- =====================================================
-- Esta migración elimina TODAS las políticas conflictivas y crea una política limpia
-- Análisis de conflictos encontrados:
-- 1. Múltiples migraciones han creado/eliminado políticas con el mismo nombre
-- 2. Políticas con validaciones complejas que fallan
-- 3. Conflictos entre validaciones de plantel_id
-- 4. Políticas que se sobreescriben entre sí

-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES DE PARENT_MESSAGES
-- =====================================================
-- Eliminar todas las posibles políticas que puedan existir
DROP POLICY IF EXISTS "Crear mensajes de padres según permisos" ON parent_messages;
DROP POLICY IF EXISTS "Ver mensajes de padres según permisos" ON parent_messages;
DROP POLICY IF EXISTS "Actualizar mensajes de padres propios" ON parent_messages;
DROP POLICY IF EXISTS "Eliminar mensajes de padres propios" ON parent_messages;
DROP POLICY IF EXISTS "Ver mensajes según rol y plantel" ON parent_messages;
DROP POLICY IF EXISTS "Crear mensajes según permisos" ON parent_messages;
DROP POLICY IF EXISTS "Actualizar mensajes según permisos" ON parent_messages;
DROP POLICY IF EXISTS "Eliminar mensajes según permisos" ON parent_messages;

-- PASO 2: CREAR POLÍTICAS COMPLETAMENTE NUEVAS Y LIMPIAS
-- =====================================================

-- Política SELECT: Ver mensajes
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
        -- Profesores pueden ver mensajes de alumnos de sus grupos
        EXISTS (
            SELECT 1 FROM alumnos a
            JOIN grupos g ON g.id = a.grupo_id
            WHERE a.id = parent_messages.alumno_id
            AND g.user_id = auth.uid()
        )
    );

-- Política INSERT: Crear mensajes (LA MÁS IMPORTANTE)
CREATE POLICY "parent_messages_insert_policy" ON parent_messages
    FOR INSERT WITH CHECK (
        -- El user_id debe coincidir con el usuario autenticado
        user_id = auth.uid()
        AND
        -- El usuario debe tener un rol válido
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('administrador', 'director', 'profesor')
        )
        AND
        -- Si se especifica alumno_id, debe existir y el usuario debe tener acceso
        (
            parent_messages.alumno_id IS NULL -- Mensajes generales permitidos
            OR
            (
                -- El alumno debe existir
                EXISTS (
                    SELECT 1 FROM alumnos a
                    WHERE a.id = parent_messages.alumno_id
                )
                AND
                -- El usuario debe tener permisos sobre este alumno
                (
                    -- Administradores tienen acceso a todos los alumnos
                    EXISTS (
                        SELECT 1 FROM profiles p
                        WHERE p.id = auth.uid() AND p.role = 'administrador'
                    )
                    OR
                    -- Directores tienen acceso a alumnos de su plantel
                    EXISTS (
                        SELECT 1 FROM alumnos a
                        JOIN grupos g ON g.id = a.grupo_id
                        JOIN profiles p ON p.id = auth.uid()
                        WHERE a.id = parent_messages.alumno_id
                        AND p.role = 'director'
                        AND p.plantel_id = g.plantel_id
                    )
                    OR
                    -- Profesores tienen acceso a alumnos de sus grupos
                    EXISTS (
                        SELECT 1 FROM alumnos a
                        JOIN grupos g ON g.id = a.grupo_id
                        WHERE a.id = parent_messages.alumno_id
                        AND g.user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Política UPDATE: Actualizar mensajes
CREATE POLICY "parent_messages_update_policy" ON parent_messages
    FOR UPDATE USING (
        -- Solo el creador del mensaje puede actualizarlo
        user_id = auth.uid()
        OR
        -- Los administradores pueden actualizar cualquier mensaje
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'administrador'
        )
    );

-- Política DELETE: Eliminar mensajes
CREATE POLICY "parent_messages_delete_policy" ON parent_messages
    FOR DELETE USING (
        -- Solo el creador del mensaje puede eliminarlo
        user_id = auth.uid()
        OR
        -- Los administradores pueden eliminar cualquier mensaje
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'administrador'
        )
    );

-- PASO 3: ASEGURAR QUE RLS ESTÉ HABILITADO
-- =====================================================
ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;

-- PASO 4: COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON POLICY "parent_messages_select_policy" ON parent_messages IS 
'Permite ver mensajes al creador, administradores, directores (alumnos de su plantel) y profesores (alumnos de sus grupos)';

COMMENT ON POLICY "parent_messages_insert_policy" ON parent_messages IS 
'Permite crear mensajes a usuarios con roles válidos, validando existencia del alumno y permisos de acceso';

COMMENT ON POLICY "parent_messages_update_policy" ON parent_messages IS 
'Permite actualizar mensajes solo al creador o administradores';

COMMENT ON POLICY "parent_messages_delete_policy" ON parent_messages IS 
'Permite eliminar mensajes solo al creador o administradores';

-- PASO 5: VERIFICACIÓN DE INTEGRIDAD
-- =====================================================
-- Esta migración resuelve los siguientes problemas:
-- 1. Elimina todas las políticas conflictivas anteriores
-- 2. Crea políticas con nombres únicos que no se sobreescriben
-- 3. Simplifica la lógica de validación
-- 4. Mantiene la seguridad por roles y planteles
-- 5. Permite mensajes generales (alumno_id NULL)
-- 6. Valida correctamente la existencia del alumno
-- 7. Evita validaciones circulares o complejas que causan errores