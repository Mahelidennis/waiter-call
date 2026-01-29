import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    
    // Verify restaurant exists and user has access
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Expanded file type validation - accept all common image formats
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Accepted formats: JPG, JPEG, PNG, WEBP, GIF, BMP, TIFF, SVG` },
        { status: 400 }
      )
    }

    // Increased file size limit (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of 5MB` },
        { status: 400 }
      )
    }

    // Generate unique file name with proper extension handling
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${random}.${fileExt}`
    const filePath = `promotions/${restaurantId}/${fileName}`

    console.log('Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath
    })

    // Upload to Supabase Storage with better error handling
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('promotions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      
      // Check if bucket doesn't exist
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not found. Please contact administrator to set up Supabase storage.' },
          { status: 500 }
        )
      }
      
      // Check if it's a permissions issue
      if (uploadError.message?.includes('permission') || uploadError.message?.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Storage permission denied. Please check Supabase storage policies.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('promotions')
      .getPublicUrl(filePath)

    console.log('Upload successful:', {
      filePath,
      publicUrl: urlData.publicUrl
    })

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

  } catch (error) {
    console.error('Error uploading promotion image:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
