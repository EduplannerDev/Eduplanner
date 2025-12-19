-- Migration: Add UPDATE RLS policies for incidencias table
-- This allows directors and admins from the same plantel to update incident status and acta_firmada_url

-- Policy for updating incident status and signed PDF URL
CREATE POLICY "Directors can update incidents from their plantel"
ON incidencias FOR UPDATE
USING (
    -- User must be director or admin from the same plantel
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('director', 'administrador')
        AND p.plantel_id = incidencias.plantel_id
    )
)
WITH CHECK (
    -- User must be director or admin from the same plantel
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('director', 'administrador')
        AND p.plantel_id = incidencias.plantel_id
    )
);
