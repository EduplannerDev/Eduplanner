-- Migración: Crear tabla planeaciones_enviadas
-- =====================================================
-- Esta migración crea la tabla para registrar envíos de planeaciones a dirección

CREATE TABLE IF NOT EXISTS planeaciones_enviadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planeacion_id UUID NOT NULL REFERENCES planeaciones(id) ON DELETE CASCADE,
    plantel_id UUID NOT NULL REFERENCES planteles(id) ON DELETE CASCADE,
    profesor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha_envio TIMESTAMPTZ DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisada')),
    comentarios_director TEXT,
    director_revisor_id UUID REFERENCES auth.users(id),
    fecha_revision TIMESTAMPTZ,
    planeacion_modificada BOOLEAN DEFAULT FALSE,
    fecha_modificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(planeacion_id) -- Una planeación se envía solo una vez
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_planeaciones_enviadas_planeacion ON planeaciones_enviadas(planeacion_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_enviadas_plantel ON planeaciones_enviadas(plantel_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_enviadas_profesor ON planeaciones_enviadas(profesor_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_enviadas_estado ON planeaciones_enviadas(estado);

-- Trigger para updated_at
CREATE TRIGGER update_planeaciones_enviadas_updated_at
    BEFORE UPDATE ON planeaciones_enviadas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE planeaciones_enviadas ENABLE ROW LEVEL SECURITY;

-- Profesores ven solo sus propios envíos
CREATE POLICY "Profesores ven sus envíos" ON planeaciones_enviadas
    FOR SELECT USING (profesor_id = auth.uid());

-- Directores ven envíos de su plantel
CREATE POLICY "Directores ven envíos de su plantel" ON planeaciones_enviadas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'director'
            AND p.plantel_id = planeaciones_enviadas.plantel_id
        )
    );

-- Administradores ven todo
CREATE POLICY "Administradores ven todos los envíos" ON planeaciones_enviadas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Solo profesores pueden crear envíos
CREATE POLICY "Profesores pueden enviar planeaciones" ON planeaciones_enviadas
    FOR INSERT WITH CHECK (
        profesor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.plantel_id = plantel_id
        )
    );

-- Solo directores pueden actualizar (revisar)
CREATE POLICY "Directores pueden revisar planeaciones" ON planeaciones_enviadas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'director'
            AND p.plantel_id = planeaciones_enviadas.plantel_id
        )
    );

-- Comentarios
COMMENT ON TABLE planeaciones_enviadas IS 'Tabla para registrar envíos de planeaciones a dirección para revisión';
COMMENT ON COLUMN planeaciones_enviadas.planeacion_id IS 'ID de la planeación enviada (UNIQUE - solo se envía una vez)';
COMMENT ON COLUMN planeaciones_enviadas.plantel_id IS 'ID del plantel al que pertenece el profesor';
COMMENT ON COLUMN planeaciones_enviadas.profesor_id IS 'ID del profesor que envió la planeación';
COMMENT ON COLUMN planeaciones_enviadas.estado IS 'Estado del envío: pendiente o revisada';
COMMENT ON COLUMN planeaciones_enviadas.planeacion_modificada IS 'Indica si la planeación fue modificada después de ser enviada/revisada';
COMMENT ON COLUMN planeaciones_enviadas.fecha_modificacion IS 'Fecha en que se detectó la última modificación de la planeación';
