-- Drop the conflicting "FOR ALL" policy
DROP POLICY IF EXISTS "Directores ven incidencias de su plantel" ON public.incidencias;

-- Drop the duplicate UPDATE policy
DROP POLICY IF EXISTS "Directors can update incidents from their plantel" ON public.incidencias;

-- Create separate, non-conflicting policies using profiles table
-- SELECT policy for directors
CREATE POLICY "Directors can view incidents from their plantel"
ON public.incidencias FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('director', 'administrador')
        AND p.plantel_id = incidencias.plantel_id
    )
);

-- UPDATE policy for directors
CREATE POLICY "Directors can update incidents from their plantel"
ON public.incidencias FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('director', 'administrador')
        AND p.plantel_id = incidencias.plantel_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('director', 'administrador')
        AND p.plantel_id = incidencias.plantel_id
    )
);
