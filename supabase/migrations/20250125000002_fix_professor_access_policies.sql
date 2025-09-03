-- Migración: Corregir políticas RLS para acceso de profesores
-- =====================================================
-- Esta migración corrige las políticas RLS para permitir que los profesores
-- accedan correctamente a sus grupos y alumnos

-- 1. CORREGIR POLÍTICAS RLS PARA GRUPOS
-- =====================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Ver grupos según rol y plantel" ON grupos;
DROP POLICY IF EXISTS "Crear grupos según rol y plantel" ON grupos;
DROP POLICY IF EXISTS "Actualizar grupos según rol y plantel" ON grupos;
DROP POLICY IF EXISTS "Eliminar grupos según rol" ON grupos;

-- Crear políticas corregidas para grupos
CREATE POLICY "Ver grupos según rol y plantel" ON grupos
  FOR SELECT USING (
    user_id = auth.uid() -- El profesor propietario
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id)
        OR (p.role = 'profesor' AND p.plantel_id = grupos.plantel_id)
      )
    )
  );

CREATE POLICY "Crear grupos según rol y plantel" ON grupos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role IN ('director', 'profesor') AND p.plantel_id = grupos.plantel_id)
      )
    )
  );

CREATE POLICY "Actualizar grupos según rol y plantel" ON grupos
  FOR UPDATE USING (
    user_id = auth.uid() -- El profesor propietario
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id)
      )
    )
  );

CREATE POLICY "Eliminar grupos según rol" ON grupos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'administrador'
        OR (p.role = 'director' AND p.plantel_id = grupos.plantel_id)
      )
    )
  );

-- 2. CORREGIR POLÍTICAS RLS PARA ALUMNOS
-- =====================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Ver alumnos según rol y plantel" ON alumnos;
DROP POLICY IF EXISTS "Crear alumnos según permisos" ON alumnos;
DROP POLICY IF EXISTS "Actualizar alumnos según permisos" ON alumnos;
DROP POLICY IF EXISTS "Eliminar alumnos según permisos" ON alumnos;

-- Crear políticas corregidas para alumnos
CREATE POLICY "Ver alumnos según rol y plantel" ON alumnos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND (
                    g.user_id = auth.uid() -- Profesor propietario del grupo
                    OR p.plantel_id = g.plantel_id -- Profesor del mismo plantel
                ))
            )
        )
    );

CREATE POLICY "Crear alumnos según permisos" ON alumnos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND g.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Actualizar alumnos según permisos" ON alumnos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND g.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Eliminar alumnos según permisos" ON alumnos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
            )
        )
    );

-- 3. CORREGIR POLÍTICAS RLS PARA PARENT_MESSAGES
-- =====================================================
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Ver mensajes según rol y plantel" ON parent_messages;
DROP POLICY IF EXISTS "Crear mensajes según permisos" ON parent_messages;
DROP POLICY IF EXISTS "Actualizar mensajes según permisos" ON parent_messages;
DROP POLICY IF EXISTS "Eliminar mensajes según permisos" ON parent_messages;

-- Crear políticas para parent_messages
CREATE POLICY "Ver mensajes según rol y plantel" ON parent_messages
    FOR SELECT USING (
        user_id = auth.uid() -- Creador del mensaje
        OR EXISTS (
            SELECT 1 FROM alumnos a
            JOIN grupos g ON g.id = a.grupo_id
            JOIN profiles p ON p.id = auth.uid()
            WHERE a.id = parent_messages.alumno_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND (
                    g.user_id = auth.uid()
                    OR p.plantel_id = g.plantel_id
                ))
            )
        )
    );

CREATE POLICY "Crear mensajes según permisos" ON parent_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM alumnos a
            JOIN grupos g ON g.id = a.grupo_id
            JOIN profiles p ON p.id = auth.uid()
            WHERE a.id = parent_messages.alumno_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND g.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Actualizar mensajes según permisos" ON parent_messages
    FOR UPDATE USING (
        user_id = auth.uid() -- Solo el creador puede actualizar
    );

CREATE POLICY "Eliminar mensajes según permisos" ON parent_messages
    FOR DELETE USING (
        user_id = auth.uid() -- Solo el creador puede eliminar
        OR EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'administrador'
        )
    );

-- 4. VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================================
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;

-- Comentarios finales
-- =====================================================
-- Esta migración corrige las políticas RLS para:
-- 1. Permitir que profesores vean grupos de su plantel
-- 2. Permitir que profesores vean alumnos de grupos de su plantel
-- 3. Corregir las políticas de parent_messages
-- 4. Mantener la seguridad por roles y planteles