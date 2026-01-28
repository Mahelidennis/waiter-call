import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for auth
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Extract restaurantId from user metadata
    const restaurantId = user.user_metadata?.restaurantId || user.app_metadata?.restaurantId
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'No restaurant associated with this account' },
        { status: 404 }
      )
    }

    // Find restaurant by ID from session
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId
      },
      select: {
        id: true,
        name: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
