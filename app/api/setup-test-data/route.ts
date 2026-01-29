import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// One-time setup endpoint to create test data in production
export async function POST(request: NextRequest) {
  try {
    console.log('Setting up test data...')

    // Create test restaurant
    const restaurant = await prisma.restaurant.upsert({
      where: { id: 'test-rest-1' },
      update: {},
      create: {
        id: 'test-rest-1',
        name: 'Demo Restaurant',
        slug: 'demo-restaurant',
        email: 'demo@restaurant.com',
        phone: '+1234567890',
        address: '123 Main St, City, State',
      },
    })

    console.log('Restaurant created:', restaurant.id)

    // Create test tables
    const tables = await Promise.all([
      prisma.table.upsert({
        where: { id: 'table-1' },
        update: {},
        create: {
          id: 'table-1',
          restaurantId: 'test-rest-1',
          number: 'T1',
          qrCode: 'demo-table-1',
          isActive: true,
        },
      }),
      prisma.table.upsert({
        where: { id: 'table-2' },
        update: {},
        create: {
          id: 'table-2',
          restaurantId: 'test-rest-1',
          number: 'T2',
          qrCode: 'demo-table-2',
          isActive: true,
        },
      }),
      prisma.table.upsert({
        where: { id: 'table-3' },
        update: {},
        create: {
          id: 'table-3',
          restaurantId: 'test-rest-1',
          number: 'T3',
          qrCode: 'demo-table-3',
          isActive: true,
        },
      }),
    ])

    console.log('Tables created:', tables.map(t => t.id))

    // Create test waiters
    const waiters = await Promise.all([
      prisma.waiter.upsert({
        where: { id: 'waiter-1' },
        update: {},
        create: {
          id: 'waiter-1',
          restaurantId: 'test-rest-1',
          name: 'John Doe',
          email: 'john@restaurant.com',
          isActive: true,
        },
      }),
      prisma.waiter.upsert({
        where: { id: 'waiter-2' },
        update: {},
        create: {
          id: 'waiter-2',
          restaurantId: 'test-rest-1',
          name: 'Jane Smith',
          email: 'jane@restaurant.com',
          isActive: true,
        },
      }),
    ])

    console.log('Waiters created:', waiters.map(w => w.id))

    // Assign waiters to tables
    const waiterTables = await Promise.all([
      prisma.waiterTable.upsert({
        where: { waiterId_tableId: { waiterId: 'waiter-1', tableId: 'table-1' } },
        update: {},
        create: {
          id: 'wt-1',
          waiterId: 'waiter-1',
          tableId: 'table-1',
        },
      }),
      prisma.waiterTable.upsert({
        where: { waiterId_tableId: { waiterId: 'waiter-1', tableId: 'table-2' } },
        update: {},
        create: {
          id: 'wt-2',
          waiterId: 'waiter-1',
          tableId: 'table-2',
        },
      }),
      prisma.waiterTable.upsert({
        where: { waiterId_tableId: { waiterId: 'waiter-2', tableId: 'table-3' } },
        update: {},
        create: {
          id: 'wt-3',
          waiterId: 'waiter-2',
          tableId: 'table-3',
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
