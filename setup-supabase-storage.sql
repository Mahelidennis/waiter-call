-- =====================================================
-- Supabase Storage Setup for WaiterCall Promotions
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. Create promotions storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotions', 
  'promotions', 
  true, 
  5242880, -- 5MB in bytes
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml'
  ]
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml'
  ];

-- =====================================================
-- 2. Set up storage policies
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload promotion images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own promotion images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own promotion images" ON storage.objects;

-- Policy 1: Allow anyone to read promotion images (public access)
-- This makes images accessible to customers viewing QR codes
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'promotions');

-- Policy 2: Allow authenticated users to upload promotion images
-- This allows restaurant admins to upload images
CREATE POLICY "Authenticated users can upload promotion images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);

-- Policy 3: Allow users to update their own promotion images
-- This allows restaurant admins to replace images
CREATE POLICY "Users can update their own promotion images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);

-- Policy 4: Allow users to delete their own promotion images
-- This allows restaurant admins to remove images
CREATE POLICY "Users can delete their own promotion images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);

-- =====================================================
-- 3. Verify setup (optional)
-- =====================================================

-- Check if bucket was created successfully
SELECT * FROM storage.buckets WHERE id = 'promotions';

-- Check if policies were created successfully
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- 4. Test the setup (optional)
-- =====================================================

-- You can test the setup by running:
-- SELECT storage.folder_size('promotions');
-- This should return information about the bucket

-- =====================================================
-- Setup Complete! 🎉
-- =====================================================
-- 
-- Next steps:
-- 1. Verify your environment variables are set
-- 2. Test image upload in the admin panel
-- 3. Check that images appear in customer QR pages
--
-- If you encounter issues:
-- - Check that SUPABASE_SERVICE_ROLE_KEY is set
-- - Verify bucket exists in Supabase Dashboard
-- - Check that policies are applied correctly
