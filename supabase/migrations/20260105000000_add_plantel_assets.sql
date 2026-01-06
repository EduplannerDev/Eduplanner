-- Migration: Add Logo and Hoja Membretada to Planteles
-- Description: Adds columns for logo and letterhead URLs and sets up storage bucket
-- Author: Antigravity

-- 1. Add columns to planteles table
ALTER TABLE public.planteles
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS hoja_membretada_url TEXT;

-- 2. Create storage bucket for plantel assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('plantel-assets', 'plantel-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS policies for storage objects
-- Allow public read access to all files in the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'plantel-assets' );

-- Allow authenticated users (specifically directors/admins) to upload/update files
-- For simplicity, we allow authenticated users to upload. 
-- In a stricter environment, we would check if the user belongs to the plantel being updated.
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'plantel-assets' );

CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'plantel-assets' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'plantel-assets' );
