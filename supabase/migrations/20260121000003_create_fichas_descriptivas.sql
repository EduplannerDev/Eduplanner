-- Migración: Crear módulo de Fichas Descriptivas
-- =====================================================
-- Esta tabla almacena las evaluaciones cualitativas de los alumnos
-- siguiendo el formato oficial de la SEP (Logros, Dificultades, Recomendaciones)

CREATE TABLE IF NOT EXISTS fichas_descriptivas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    
    -- Metadatos del ciclo
    ciclo_escolar VARCHAR(20) NOT NULL,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    
    -- Estado de promoción (checkboxes del PDF)
    estado_promocion VARCHAR(20) CHECK (estado_promocion IN ('promovido', 'condicionado', 'no_promovido')),
    
    -- Contenido cualitativo (Áreas grandes de texto)
    logros TEXT,           -- "Logros" en el PDF
    dificultades TEXT,     -- "Dificultades" en el PDF
    recomendaciones TEXT,  -- "Recomendaciones para la intervención docente"
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Evitar duplicados por ciclo
    CONSTRAINT unique_ficha_alumno_ciclo UNIQUE(alumno_id, ciclo_escolar)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_fichas_user_id ON fichas_descriptivas(user_id);
CREATE INDEX IF NOT EXISTS idx_fichas_alumno_id ON fichas_descriptivas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_fichas_grupo_id ON fichas_descriptivas(grupo_id);

-- Trigger para updated_at
CREATE TRIGGER update_fichas_descriptivas_updated_at
    BEFORE UPDATE ON fichas_descriptivas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- COMENTARIOS
COMMENT ON TABLE fichas_descriptivas IS 'Evaluaciones cualitativas de alumnos (Logros, Dificultades, Recomendaciones)';
COMMENT ON COLUMN fichas_descriptivas.estado_promocion IS 'Estado: promovido, condicionado, no_promovido';

-- POLÍTICAS RLS (Seguridad)
ALTER TABLE fichas_descriptivas ENABLE ROW LEVEL SECURITY;

-- 1. Ver fichas (Propio usuario o directores/admins del mismo plantel)
CREATE POLICY "Ver fichas según permisos" ON fichas_descriptivas
    FOR SELECT USING (
        user_id = auth.uid() -- Profesor creador
        OR EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = fichas_descriptivas.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
            )
        )
    );

-- 2. Crear fichas (Solo el profesor del grupo o admin/director)
CREATE POLICY "Crear fichas según permisos" ON fichas_descriptivas
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND g.user_id = auth.uid())
            )
        )
    );

-- 3. Actualizar fichas (Propio creador o admins)
CREATE POLICY "Actualizar fichas propias" ON fichas_descriptivas
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'administrador' OR p.role = 'director')
        )
    );

-- 4. Eliminar fichas (Propio creador o admins)
CREATE POLICY "Eliminar fichas propias" ON fichas_descriptivas
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'administrador' OR p.role = 'director')
        )
    );
