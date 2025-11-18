import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils/slugify'

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ])
}

export async function POST(request: NextRequest) {
  let restaurantId: string | null = null
  
  try {
    const body = await request.json()
    const {
      restaurantName,
      adminEmail,
      adminPassword,
      phone,
      address,
    } = body || {}

    if (!restaurantName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const slug = slugify(restaurantName)
    
    // Check for existing restaurant with timeout
    const existingRestaurant = await withTimeout(
      prisma.restaurant.findUnique({
        where: { slug },
      }),
      5000 // 5 second timeout
    )

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'A restaurant with this name already exists' },
        { status: 400 }
      )
    }

    // Create restaurant record first with timeout
    const restaurant = await withTimeout(
      prisma.restaurant.create({
        data: {
          name: restaurantName,
          slug,
          email: adminEmail,
          phone: phone || null,
          address: address || null,
        },
      }),
      10000 // 10 second timeout
    )
    
    restaurantId = restaurant.id

    // Validate Supabase environment variables before making the call
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Clean up restaurant
      if (restaurantId) {
        try {
          await prisma.restaurant.delete({ where: { id: restaurantId } })
        } catch (cleanupError) {
          console.error('Error cleaning up restaurant:', cleanupError)
        }
      }
      
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Create Supabase user with timeout
    let supabase
    try {
      supabase = createServiceClient()
    } catch (supabaseError: any) {
      // Clean up restaurant
      if (restaurantId) {
        try {
          await prisma.restaurant.delete({ where: { id: restaurantId } })
        } catch (cleanupError) {
          console.error('Error cleaning up restaurant:', cleanupError)
        }
      }
      
      console.error('Supabase client creation error:', supabaseError)
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    const { data, error } = await withTimeout(
      supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          restaurantId: restaurant.id,
        },
        app_metadata: {
          role: 'admin',
          restaurantId: restaurant.id,
        },
      }),
      15000 // 15 second timeout for Supabase
    )

    if (error || !data.user) {
      // Clean up restaurant if Supabase user creation fails
      if (restaurantId) {
        try {
          await prisma.restaurant.delete({ where: { id: restaurantId } })
        } catch (cleanupError) {
          console.error('Error cleaning up restaurant:', cleanupError)
        }
      }
      
      const errorMessage = error?.message || 'Failed to create admin account'
      console.error('Supabase user creation error:', errorMessage)
      
      return NextResponse.json(
        { 
          error: errorMessage.includes('already registered') 
            ? 'An account with this email already exists'
            : errorMessage || 'Failed to create admin account. Please try again.'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        restaurantId: restaurant.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Admin signup error:', error)
    
    // Clean up restaurant if it was created
    if (restaurantId) {
      try {
        await prisma.restaurant.delete({ where: { id: restaurantId } })
      } catch (cleanupError) {
        console.error('Error cleaning up restaurant:', cleanupError)
      }
    }
    
    const errorMessage = error?.message || 'Failed to create account'
    
    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please check your connection and try again.' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}


