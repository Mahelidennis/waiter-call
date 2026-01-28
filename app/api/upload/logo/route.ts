import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  const userRestaurantId = user.user_metadata?.restaurantId || user.app_metadata?.restaurantId

  if (!userRestaurantId) {
    return null
  }

  return {
    user,
    restaurantId: userRestaurantId
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, and SVG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `restaurant-${auth.restaurantId}-${timestamp}-${randomString}.${fileExtension}`

    // For now, we'll use a simple approach: convert to base64 and return as data URL
    // In production, you should upload to a proper storage service like Vercel Blob, S3, or Supabase Storage
    const base64 = buffer.toString('base64')
    const mimeType = file.type
    const dataUrl = `data:${mimeType};base64,${base64}`

    console.log('Logo uploaded successfully:', {
      fileName,
      size: file.size,
      type: file.type,
      restaurantId: auth.restaurantId
    })

    return NextResponse.json({
      success: true,
      logoUrl: dataUrl,
      fileName,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}
