import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('=== CLEANING UP OLD DATA AND FIXING CALL WAITER ===')
    
    // Delete old string-based test data
    console.log('Deleting old test data...')
    
    // Delete old waiter assignments
    await prisma.waiterTable.deleteMany({
      where: {
        OR: [
          { waiterId: { in: ['waiter-1', 'waiter-2'] } },
          { tableId: { in: ['table-1', 'table-2', 'table-3'] } }
        ]
      }
    })
    
    // Delete old waiters
    await prisma.waiter.deleteMany({
      where: {
        id: { in: ['waiter-1', 'waiter-2'] }
      }
    })
    
    // Delete old tables
    await prisma.table.deleteMany({
      where: {
        id: { in: ['table-1', 'table-2', 'table-3'] }
      }
    })
    
    // Delete old restaurant
    await prisma.restaurant.deleteMany({
      where: {
        id: 'test-rest-1'
      }
    })
    
    console.log('Old data deleted successfully')
    
    // Create fresh UUID-based test data
    console.log('Creating fresh UUID test data...')
    
    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Demo Restaurant',
        slug: 'demo-restaurant',
        email: 'demo@restaurant.com',
        phone: '+1234567890',
        address: '123 Main St, City, State',
      }
    })
    
    // Create tables
    const tables = await Promise.all([
      prisma.table.create({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          number: 'T1',
          qrCode: 'demo-table-1',
          isActive: true,
        },
      }),
      prisma.table.create({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          number: 'T2',
          qrCode: 'demo-table-2',
          isActive: true,
        },
      }),
      prisma.table.create({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          number: 'T3',
          qrCode: 'demo-table-3',
          isActive: true,
        },
      }),
    ])
    
    // Create waiters
    const waiters = await Promise.all([
      prisma.waiter.create({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440004',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john@restaurant.com',
          isActive: true,
        },
      }),
      prisma.waiter.create({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440005',
          restaurantId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Jane Smith',
          email: 'jane@restaurant.com',
          isActive: true,
        },
      }),
    ])
    
    // Create waiter assignments
    await Promise.all([
      prisma.waiterTable.create({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440006',
          waiterId: '550e8400-e29b-41d4-a716-446655440004',
          tableId: '550e8400-e29b-41d4-a716-446655440001',
        },
      }),
      prisma.waiterTable.create({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440007',
          waiterId: '550e8400-e29b-41d4-a716-446655440004',
          tableId: '550e8400-e29b-41d4-a716-446655440002',
        },
      }),
      prisma.waiterTable.create({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440008',
          waiterId: '550e8400-e29b-41d4-a716-446655440005',
          tableId: '550e8400-e29b-41d4-a716-446655440003',
        },
      }),
    ])
    
    console.log('Fresh UUID test data created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Call Waiter data fixed successfully',
      data: {
        restaurant: { id: restaurant.id, name: restaurant.name },
        tables: tables.map(t => ({ id: t.id, number: t.number, qrCode: t.qrCode })),
        waiters: waiters.map(w => ({ id: w.id, name: w.name }))
      }
    })
  } catch (error) {
    console.error('Error fixing call waiter data:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
