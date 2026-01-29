# Supabase Storage Setup for Promotions

This guide will help you set up Supabase Storage to handle promotion image uploads.

## 🚀 Quick Setup

### 1. Go to Supabase Dashboard
- Navigate to [supabase.com](https://supabase.com)
- Sign in to your account
- Select your project

### 2. Create Storage Bucket

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to **Storage** section in the left sidebar
2. Click **"New bucket"**
3. Enter bucket details:
   - **Name**: `promotions`
   - **Public bucket**: ✅ Yes (check the box)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: Leave empty for now (we'll set policies)

4. Click **"Save"**

#### Option B: Using SQL Editor
1. Go to **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Copy and run the SQL below:

```sql
-- Create promotions storage bucket
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
```

### 3. Set Up Storage Policies

#### Using SQL Editor (Required)
Run these SQL commands to set up proper access policies:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload promotion images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own promotion images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own promotion images" ON storage.objects;

-- Create policies for promotions bucket
-- 1. Allow anyone to read promotion images (public access)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'promotions');

-- 2. Allow authenticated users to upload promotion images
CREATE POLICY "Authenticated users can upload promotion images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);

-- 3. Allow users to update their own promotion images
CREATE POLICY "Users can update their own promotion images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);

-- 4. Allow users to delete their own promotion images
CREATE POLICY "Users can delete their own promotion images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'promotions' AND 
  auth.role() = 'authenticated'
);
```

### 4. Verify Environment Variables

Make sure these environment variables are set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important**: You need the `SUPABASE_SERVICE_ROLE_KEY` for server-side uploads. You can find it in:
1. Supabase Dashboard → **Settings** → **API**
2. Look for **"service_role"** key (not the "anon" key)

## 🔧 Troubleshooting

### Error: "Storage bucket not found"
**Solution**: The bucket doesn't exist. Run the SQL above to create it.

### Error: "Storage permission denied"
**Solution**: The policies aren't set correctly. Run the policy SQL above.

### Error: "Unauthorized"
**Solution**: Check your `SUPABASE_SERVICE_ROLE_KEY` environment variable.

### Error: "File too large"
**Solution**: The bucket has a size limit. The SQL above sets it to 5MB.

## 🧪 Test the Setup

1. Go to your restaurant admin panel
2. Try to create a new promotion
3. Upload an image
4. If it works, you're all set! 🎉

## 📁 Folder Structure

Uploaded images will be stored as:
```
promotions/
├── {restaurantId}/
│   ├── 1640995200000-abc123.jpg
│   ├── 1640995300000-def456.png
│   └── ...
```

## 🔒 Security Notes

- Images are publicly accessible (good for customer-facing)
- Only authenticated users can upload
- Each restaurant has its own folder
- File size is limited to 5MB
- Only image files are accepted

## 🚀 Next Steps

Once setup is complete:
1. Test image uploads in the admin panel
2. Verify images appear in customer QR pages
3. Check that the promotion images load correctly

Need help? Check the Supabase Storage documentation: https://supabase.com/docs/guides/storage
