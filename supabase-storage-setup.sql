-- Create promotions storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotions', 
  'promotions', 
  true, 
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for promotions bucket
-- Allow anyone to read promotion images
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'promotions');

-- Allow authenticated users to upload promotion images
CREATE POLICY "Authenticated users can upload promotion images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);

-- Allow users to update their own promotion images
CREATE POLICY "Users can update their own promotion images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);

-- Allow users to delete their own promotion images
CREATE POLICY "Users can delete their own promotion images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);
