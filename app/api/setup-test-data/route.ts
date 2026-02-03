import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// One-time setup endpoint to create test data in production
export async function POST(request: NextRequest) {
  try {
    console.log('Setting up test data...')

    // Create test restaurant with proper UUID
    const restaurant = await prisma.restaurant.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Demo Restaurant',
        slug: 'demo-restaurant',
        email: 'demo@restaurant.com',
        phone: '+1234567890',
        address: '123 Main St, City, State',
      },
    })

    console.log('Restaurant created:', restaurant.id)

    // Create test tables with proper UUIDs
    const tables = await Promise.all([
      prisma.table.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          number: 'T1',
          qrCode: 'demo-table-1',
          isActive: true,
        },
      }),
      prisma.table.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440002' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          number: 'T2',
          qrCode: 'demo-table-2',
          isActive: true,
        },
      }),
      prisma.table.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440003' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          number: 'T3',
          qrCode: 'demo-table-3',
          isActive: true,
        },
      }),
    ])

    console.log('Tables created:', tables.map(t => t.id))

    // Create test waiters with proper UUIDs
    const waiters = await Promise.all([
      prisma.waiter.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440004' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440004',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john@restaurant.com',
          isActive: true,
        },
      }),
      prisma.waiter.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440005' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440005',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Jane Smith',
          email: 'jane@restaurant.com',
          isActive: true,
        },
      }),
    ])

    console.log('Waiters created:', waiters.map(w => w.id))

    // Assign waiters to tables with proper UUIDs
    const waiterTables = await Promise.all([
      prisma.waiterTable.upsert({
        where: { waiterId_tableId: { waiterId: '550e8400-e29b-41d4-a716-446655440004', tableId: '550e8400-e29b-41d4-a716-446655440001' } },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440006',
          waiterId: '550e8400-e29b-41d4-a716-446655440004',
          tableId: '550e8400-e29b-41d4-a716-446655440001',
        },
      }),
      prisma.waiterTable.upsert({
        where: { waiterId_tableId: { waiterId: '550e8400-e29b-41d4-a716-446655440004', tableId: '550e8400-e29b-41d4-a716-446655440002' } },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440007',
          waiterId: '550e8400-e29b-41d4-a716-446655440004',
          tableId: '550e8400-e29b-41d4-a716-446655440002',
        },
      }),
      prisma.waiterTable.upsert({
        where: { waiterId_tableId: { waiterId: '550e8400-e29b-41d4-a716-446655440005', tableId: '550e8400-e29b-41d4-a716-446655440003' } },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440008',
          waiterId: '550e8400-e29b-41d4-a716-446655440005',
          tableId: '550e8400-e29b-41d4-a716-446655440003',
        },
      }),
    ])

    console.log('Waiter assignments created:', waiterTables.map(wt => wt.id))

    // Create test promotions
    const promotions = await Promise.all([
      prisma.promotion.upsert({
        where: { id: 'promo-1' },
        update: {},
        create: {
          id: 'promo-1',
          restaurantId: 'test-rest-1',
          title: 'Happy Hour Special',
          description: '50% off all drinks from 5-7 PM',
          isActive: true,
          displayOrder: 1,
        },
      }),
      prisma.promotion.upsert({
        where: { id: 'promo-2' },
        update: {},
        create: {
          id: 'promo-2',
          restaurantId: 'test-rest-1',
          title: 'Weekend Brunch',
          description: 'Join us every weekend for our special brunch menu',
          isActive: true,
          displayOrder: 2,
        },
      }),
    ])

    console.log('Promotions created:', promotions.map(p => p.id))

    // Create test subscription
    const subscription = await prisma.subscription.upsert({
      where: { restaurantId: 'test-rest-1' },
      update: {},
      create: {
        id: 'sub-1',
        restaurantId: 'test-rest-1',
        status: 'TRIAL',
        plan: 'basic',
      },
    })

    console.log('Subscription created:', subscription.id)

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        restaurant: restaurant.id,
        tables: tables.map(t => ({ id: t.id, number: t.number, qrCode: t.qrCode })),
        waiters: waiters.map(w => ({ id: w.id, name: w.name })),
        promotions: promotions.map(p => ({ id: p.id, title: p.title })),
        subscription: subscription.id,
      }
    })

  } catch (error) {
    console.error('Error setting up test data:', error)
    return NextResponse.json(
      { error: 'Failed to setup test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
