import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerClient } from '@/lib/supabase/server'

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // CRITICAL: Get restaurantId from user metadata (session), not URL
  const userRestaurantId = user.user_metadata?.restaurantId || user.app_metadata?.restaurantId

  if (!userRestaurantId) {
    return null
  }

  return {
    user,
    restaurantId: userRestaurantId
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const auth = await getAuthenticatedUser(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SECURITY: Ensure user can only access their own restaurant
    if (auth.restaurantId !== restaurantId) {
      console.error('🚨 SECURITY: User trying to access wrong restaurant:', {
        userRestaurantId: auth.restaurantId,
        requestedRestaurantId: restaurantId,
        userId: auth.user.id
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        menuUrl: true,
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const auth = await getAuthenticatedUser(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SECURITY: Ensure user can only update their own restaurant
    if (auth.restaurantId !== restaurantId) {
      console.error('🚨 SECURITY: User trying to update wrong restaurant:', {
        userRestaurantId: auth.restaurantId,
        requestedRestaurantId: restaurantId,
        userId: auth.user.id
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validation
    const updateData: any = {}

    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Restaurant name is required' },
          { status: 400 }
        )
      }
      updateData.name = body.name.trim()
    }

    if (body.email !== undefined) {
      if (!body.email || !isValidEmail(body.email)) {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400 }
        )
      }
      updateData.email = body.email.trim()
    }

    if (body.menuUrl !== undefined) {
      if (body.menuUrl && body.menuUrl.trim() !== '') {
        if (!isValidUrl(body.menuUrl)) {
          return NextResponse.json(
            { error: 'Menu URL must be a valid URL' },
            { status: 400 }
          )
        }
        updateData.menuUrl = body.menuUrl.trim()
      } else {
        updateData.menuUrl = null
      }
    }

    if (body.logoUrl !== undefined) {
      if (body.logoUrl && body.logoUrl.trim() !== '') {
        if (!isValidUrl(body.logoUrl)) {
          return NextResponse.json(
            { error: 'Logo URL must be a valid URL' },
            { status: 400 }
          )
        }
        updateData.logoUrl = body.logoUrl.trim()
      } else {
        updateData.logoUrl = null
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        menuUrl: true,
      },
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    )
  }
}

