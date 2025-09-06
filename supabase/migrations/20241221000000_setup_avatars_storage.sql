-- Migración: Configurar Storage para Avatares
-- =====================================================
-- Esta migración configura el bucket de avatares y sus políticas RLS
-- para permitir que los usuarios suban y actualicen sus fotos de perfil

-- 1. CREAR BUCKET DE AVATARES (si no existe)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB en bytes
  '{"image/jpeg","image/jpg","image/png","image/gif","image/webp"}'
)
ON CONFLICT (id) DO NOTHING;

-- 2. ELIMINAR POLÍTICAS EXISTENTES SI EXISTEN
-- =====================================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar uploads are restricted to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatar updates are restricted to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatar deletes are restricted to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;

-- 3. CREAR POLÍTICAS RLS PARA STORAGE DE AVATARES
-- =====================================================

-- Política para permitir a los usuarios subir sus propios avatares
CREATE POLICY "Avatar uploads are restricted to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir a los usuarios actualizar sus propios avatares
CREATE POLICY "Avatar updates are restricted to own folder" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir a los usuarios eliminar sus propios avatares
CREATE POLICY "Avatar deletes are restricted to own folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir lectura pública de avatares
CREATE POLICY "Avatars are publicly readable" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
  );
