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
  
  // Log the start of signup for debugging
  console.log('Signup request received at:', new Date().toISOString())
  
  try {
    const body = await request.json()
    console.log('Signup request body received (email hidden)')
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
    const missingVars = []
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars)
      // Clean up restaurant
      if (restaurantId) {
        try {
          await prisma.restaurant.delete({ where: { id: restaurantId } })
        } catch (cleanupError) {
          console.error('Error cleaning up restaurant:', cleanupError)
        }
      }
      
      return NextResponse.json(
        { 
          error: `Server configuration error: Missing ${missingVars.join(', ')}. Please check your Vercel environment variables.` 
        },
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

    let supabaseResponse
    try {
      supabaseResponse = await withTimeout(
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
    } catch (timeoutError: any) {
      // Clean up restaurant if Supabase call times out
      if (restaurantId) {
        try {
          await prisma.restaurant.delete({ where: { id: restaurantId } })
        } catch (cleanupError) {
          console.error('Error cleaning up restaurant:', cleanupError)
        }
      }
      
      console.error('Supabase API timeout:', timeoutError)
      return NextResponse.json(
        { 
          error: 'Connection to authentication service timed out. Please check your internet connection and try again.'
        },
        { status: 504 }
      )
    }

    const { data, error } = supabaseResponse

    if (error || !data?.user) {
      // Clean up restaurant if Supabase user creation fails
      if (restaurantId) {
        try {
          await prisma.restaurant.delete({ where: { id: restaurantId } })
        } catch (cleanupError) {
          console.error('Error cleaning up restaurant:', cleanupError)
        }
      }
      
      const errorMessage = error?.message || 'Failed to create admin account'
      console.error('Supabase user creation error:', {
        message: errorMessage,
        status: error?.status,
        code: error?.code,
        email: adminEmail,
      })
      
      // Provide more specific error messages
      let userFriendlyError = 'Failed to create admin account. Please try again.'
      
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || error?.code === 'user_already_exists') {
        userFriendlyError = 'An account with this email already exists. Please use a different email or sign in instead.'
      } else if (errorMessage.includes('Invalid email') || error?.code === 'invalid_email') {
        userFriendlyError = 'Invalid email address. Please check and try again.'
      } else if (errorMessage.includes('Password') || error?.code === 'weak_password') {
        userFriendlyError = 'Password is too weak. Please use a stronger password (at least 6 characters).'
      } else if (error?.status === 400) {
        userFriendlyError = errorMessage || 'Invalid request. Please check your information and try again.'
      } else if (error?.status === 401 || error?.status === 403) {
        userFriendlyError = 'Authentication service configuration error. Please contact support.'
      } else if (error?.status === 500 || error?.status === 503) {
        userFriendlyError = 'Authentication service is temporarily unavailable. Please try again in a moment.'
      }
      
      return NextResponse.json(
        { error: userFriendlyError },
        { status: error?.status || 400 }
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
    console.error('Admin signup error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      restaurantId,
    })
    
    // Clean up restaurant if it was created
    if (restaurantId) {
      try {
        await prisma.restaurant.delete({ where: { id: restaurantId } })
      } catch (cleanupError) {
        console.error('Error cleaning up restaurant:', cleanupError)
      }
    }
    
    const errorMessage = error?.message || 'Failed to create account'
    
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please check your connection and try again.' },
        { status: 504 }
      )
    }
    
    // Check for database connection errors
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('database')) {
      return NextResponse.json(
        { error: 'Database connection error. Please check your database configuration.' },
        { status: 503 }
      )
    }
    
    // Check for Prisma errors
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A restaurant with this name or email already exists.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}


