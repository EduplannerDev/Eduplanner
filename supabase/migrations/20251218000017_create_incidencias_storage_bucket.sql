-- Migration: Create Supabase Storage bucket for signed incident PDFs
-- Bucket name: incidencias-firmadas

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('incidencias-firmadas', 'incidencias-firmadas', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for SELECT (directors and admins from same plantel can view)
CREATE POLICY "Directors can view signed incident PDFs from their plantel"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'incidencias-firmadas'
    AND (
        -- Check if user is director/admin of the plantel in the path
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('director', 'administrador')
            AND (storage.foldername(name))[1] = p.plantel_id::text
        )
    )
);

-- Create RLS policy for INSERT (directors and admins can upload)
CREATE POLICY "Directors can upload signed incident PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'incidencias-firmadas'
    AND (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('director', 'administrador')
            AND (storage.foldername(name))[1] = p.plantel_id::text
        )
    )
);

-- Create RLS policy for DELETE (only admins can delete)
CREATE POLICY "Only admins can delete signed incident PDFs"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'incidencias-firmadas'
    AND (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    )
);
