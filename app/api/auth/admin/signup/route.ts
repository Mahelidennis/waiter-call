import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils/slugify'
import { validateDatabaseUrl } from '@/lib/utils/databaseUrl'

// Configure route for execution time
// Vercel Hobby: 10s max, Pro: 60s max
// Using 10s to work on both plans
export const maxDuration = 10
export const runtime = 'nodejs'

function isPrismaConnectionError(error: any) {
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : ''
  const code = error?.code
  return (
    code === 'P1001' || // can't reach database server
    code === 'P1002' || // connection timeout
    code === 'P1017' || // server closed connection
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('getaddrinfo') ||
    message.includes('connect') ||
    message.includes('connection refused')
  )
}

function prismaConnectionProblemResponse(error: any, action: string) {
  const payload: Record<string, unknown> = {
    error: 'Database connection error. Please try again shortly.',
    action,
  }

  if (process.env.NODE_ENV === 'development') {
    payload.details = {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    }
  }

  return NextResponse.json(payload, { status: 503 })
}

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
  
  // Validate DATABASE_URL before proceeding
  const databaseValidation = validateDatabaseUrl(process.env.DATABASE_URL)
  if (!databaseValidation.isValid) {
    return NextResponse.json(
      { 
        error: databaseValidation.errorMessage || 'DATABASE_URL is invalid. Please check your environment variables.',
      },
      { status: 500 }
    )
  }
  
  // Log the start of signup for debugging
  console.log('Signup request received at:', new Date().toISOString())
  
  try {
    // Fail fast on runtime connection issues instead of timing out later
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error('Prisma connection error during signup:', dbError)
      return prismaConnectionProblemResponse(dbError, 'connect')
    }

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
    
    // Check for existing restaurant with timeout (reduced for serverless)
    let existingRestaurant
    try {
      existingRestaurant = await withTimeout(
        prisma.restaurant.findUnique({
      where: { slug },
        }),
        3000 // 3 second timeout
      )
    } catch (dbError: any) {
      console.error('Database query error (findUnique):', dbError)
      if (isPrismaConnectionError(dbError)) {
        return prismaConnectionProblemResponse(dbError, 'find restaurant by slug')
      }
      throw dbError
    }

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'A restaurant with this name already exists' },
        { status: 400 }
      )
    }

    // Create restaurant record first with timeout (reduced for serverless)
    let restaurant
    try {
      restaurant = await withTimeout(
        prisma.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        email: adminEmail,
        phone: phone || null,
        address: address || null,
      },
        }),
        5000 // 5 second timeout
      )
    } catch (dbError: any) {
      console.error('Database query error (create):', dbError)
      if (isPrismaConnectionError(dbError)) {
        return prismaConnectionProblemResponse(dbError, 'create restaurant')
      }
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'A restaurant with this name or email already exists.' },
          { status: 400 }
        )
      }
      throw dbError
    }
    
    restaurantId = restaurant.id

    // Create Supabase user and sign them in
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
        6000 // 6 second timeout for Supabase (must complete within 10s total)
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

    // CRITICAL: Auto-login the user by creating a fresh session
    // This MUST succeed - no fallback to manual login
    try {
      console.log('Creating fresh session for new admin:', adminEmail)
      
      // First, clear any existing sessions to prevent contamination
      await supabase.auth.signOut()
      
      // Create fresh session for the new admin
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })

      if (signInError) {
        console.error('Critical: Auto-login failed for new admin:', signInError)
        // This should never happen - if it does, we have a serious issue
        return NextResponse.json(
          {
            success: false,
            error: 'Account created but authentication failed',
            requiresLogin: true,
            message: 'Please contact support - authentication system error'
          },
          { status: 500 }
        )
      }

      if (!signInData.session) {
        console.error('Critical: No session created for new admin')
        return NextResponse.json(
          {
            success: false,
            error: 'Account created but no session established',
            requiresLogin: true,
            message: 'Please contact support - session creation failed'
          },
          { status: 500 }
        )
      }

      console.log('✅ New admin session established:', {
        userId: signInData.user.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      })

      // CRITICAL: Update user metadata with restaurantId for session persistence
      try {
        await supabase.auth.updateUser({
          data: {
            user_metadata: {
              role: 'admin',
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            },
            app_metadata: {
              role: 'admin',
              restaurantId: restaurant.id,
            }
          }
        })
      } catch (updateError) {
        console.warn('Failed to update user metadata:', updateError)
        // Don't fail the signup if metadata update fails
      }

      // Return success with proper session established
      const response = NextResponse.json(
        {
          success: true,
          restaurantId: restaurant.id,
          requiresLogin: false,
          message: 'Account created successfully',
          userId: signInData.user.id
        },
        { status: 201 }
      )

      // Set the session cookies explicitly
      response.cookies.set('sb-access-token', signInData.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })

      response.cookies.set('sb-refresh-token', signInData.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })

      return response

    } catch (error) {
      console.error('Critical error during auto-login:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Account created but login failed',
          requiresLogin: true,
          message: 'Please contact support - login system error'
        },
        { status: 500 }
      )
    }
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
    
    if (isPrismaConnectionError(error)) {
      return prismaConnectionProblemResponse(error, 'signup')
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


