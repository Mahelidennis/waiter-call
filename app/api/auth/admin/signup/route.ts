import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils/slugify'

export async function POST(request: NextRequest) {
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

    const slug = slugify(restaurantName)
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { slug },
    })

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'A restaurant with this name already exists' },
        { status: 400 }
      )
    }

    // Create restaurant record first
    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        email: adminEmail,
        phone: phone || null,
        address: address || null,
      },
    })

    const supabase = createServiceClient()
    const { data, error } = await supabase.auth.admin.createUser({
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
    })

    if (error || !data.user) {
      await prisma.restaurant.delete({ where: { id: restaurant.id } })
      return NextResponse.json(
        { error: error?.message || 'Failed to create admin account' },
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
  } catch (error) {
    console.error('Admin signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}

