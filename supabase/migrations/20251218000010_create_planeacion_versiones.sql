-- Create table for storing planning versions/snapshots
CREATE TABLE IF NOT EXISTS planeacion_versiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planeacion_id UUID NOT NULL REFERENCES planeaciones(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    titulo TEXT,
    contenido TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    motivo TEXT -- 'envio_inicial', 'correccion', 'edicion_manual'
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_planeacion_versiones_planeacion_id ON planeacion_versiones(planeacion_id);

-- RLS Policies
ALTER TABLE planeacion_versiones ENABLE ROW LEVEL SECURITY;

-- Users can view versions of their own plannings
CREATE POLICY "Users can view versions of own plannings"
ON planeacion_versiones FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM planeaciones p
        WHERE p.id = planeacion_versiones.planeacion_id
        AND p.user_id = auth.uid()
    )
);

-- Directors can view versions of plannings sent to their plantel
CREATE POLICY "Directors can view versions of sent plannings"
ON planeacion_versiones FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM planeaciones_enviadas pe
        JOIN profiles p ON p.id = auth.uid()
        WHERE pe.planeacion_id = planeacion_versiones.planeacion_id
        AND pe.plantel_id = p.plantel_id
        AND p.role IN ('director', 'administrador')
    )
);

-- Users can insert versions for their plannings
CREATE POLICY "Users can insert versions for own plannings"
ON planeacion_versiones FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM planeaciones p
        WHERE p.id = planeacion_versiones.planeacion_id
        AND p.user_id = auth.uid()
    )
);
