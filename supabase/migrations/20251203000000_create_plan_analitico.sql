-- Migración: Crear tablas para el Plan Analítico (Diagnóstico)
-- =====================================================
-- Esta migración crea las tablas necesarias para el módulo de Plan Analítico,
-- incluyendo el diagnóstico, problemáticas detectadas y su vinculación con el currículo SEP.

-- 1. TABLA PRINCIPAL: PLANES ANALITICOS
-- =====================================================
CREATE TABLE IF NOT EXISTS planes_analiticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    ciclo_escolar VARCHAR(20) NOT NULL,
    
    -- Inputs del profesor
    input_comunitario TEXT,
    input_escolar TEXT,
    input_grupo TEXT,
    
    -- Resultado de la IA
    diagnostico_generado TEXT,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Índices para planes_analiticos
CREATE INDEX IF NOT EXISTS idx_planes_analiticos_user_id ON planes_analiticos(user_id);
CREATE INDEX IF NOT EXISTS idx_planes_analiticos_grupo_id ON planes_analiticos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_planes_analiticos_deleted_at ON planes_analiticos(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at en planes_analiticos
CREATE TRIGGER update_planes_analiticos_updated_at
    BEFORE UPDATE ON planes_analiticos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLA SECUNDARIA: PROBLEMATICAS
-- =====================================================
CREATE TABLE IF NOT EXISTS plan_analitico_problematicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES planes_analiticos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para plan_analitico_problematicas
CREATE INDEX IF NOT EXISTS idx_problematicas_plan_id ON plan_analitico_problematicas(plan_id);

-- Trigger para updated_at en plan_analitico_problematicas
CREATE TRIGGER update_problematicas_updated_at
    BEFORE UPDATE ON plan_analitico_problematicas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. TABLA PIVOTE: VINCULACION CON CURRICULO (PDAs)
-- =====================================================
CREATE TABLE IF NOT EXISTS problematica_contenidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problematica_id UUID NOT NULL REFERENCES plan_analitico_problematicas(id) ON DELETE CASCADE,
    contenido_id UUID NOT NULL REFERENCES curriculo_sep(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Evitar duplicados
    CONSTRAINT unique_problematica_contenido UNIQUE(problematica_id, contenido_id)
);

-- Índices para problematica_contenidos
CREATE INDEX IF NOT EXISTS idx_problematica_contenidos_problematica_id ON problematica_contenidos(problematica_id);
CREATE INDEX IF NOT EXISTS idx_problematica_contenidos_contenido_id ON problematica_contenidos(contenido_id);

-- 4. COMENTARIOS Y DOCUMENTACION
-- =====================================================
COMMENT ON TABLE planes_analiticos IS 'Tabla principal del Plan Analítico (Diagnóstico)';
COMMENT ON COLUMN planes_analiticos.user_id IS 'Profesor que crea el plan';
COMMENT ON COLUMN planes_analiticos.grupo_id IS 'Grupo al que pertenece el diagnóstico';
COMMENT ON COLUMN planes_analiticos.diagnostico_generado IS 'Texto generado por IA con el diagnóstico';

COMMENT ON TABLE plan_analitico_problematicas IS 'Problemáticas detectadas en el diagnóstico';
COMMENT ON TABLE problematica_contenidos IS 'Vinculación entre problemáticas y PDAs del currículo SEP';

-- 5. POLITICAS RLS
-- =====================================================
ALTER TABLE planes_analiticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_analitico_problematicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE problematica_contenidos ENABLE ROW LEVEL SECURITY;

-- Políticas para planes_analiticos
CREATE POLICY "Usuarios pueden ver sus propios planes" ON planes_analiticos
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'administrador')
    );

CREATE POLICY "Usuarios pueden crear sus propios planes" ON planes_analiticos
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Usuarios pueden actualizar sus propios planes" ON planes_analiticos
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'administrador')
    );

CREATE POLICY "Usuarios pueden eliminar sus propios planes" ON planes_analiticos
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'administrador')
    );

-- Políticas para plan_analitico_problematicas
-- (Heredan acceso a través del plan padre)
CREATE POLICY "Acceso a problematicas por plan" ON plan_analitico_problematicas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM planes_analiticos p
            WHERE p.id = plan_analitico_problematicas.plan_id
            AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'administrador'))
        )
    );

-- Políticas para problematica_contenidos
-- (Heredan acceso a través de la problemática -> plan)
CREATE POLICY "Acceso a contenidos por problematica" ON problematica_contenidos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM plan_analitico_problematicas pp
            JOIN planes_analiticos p ON p.id = pp.plan_id
            WHERE pp.id = problematica_contenidos.problematica_id
            AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'administrador'))
        )
    );
