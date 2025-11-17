import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Create a new waiter call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableId, restaurantId } = body

    if (!tableId || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing tableId or restaurantId' },
        { status: 400 }
      )
    }

    // Verify table exists and belongs to restaurant
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId,
        isActive: true,
      },
    })

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    // Get assigned waiter for this table (if any)
    const waiterTable = await prisma.waiterTable.findFirst({
      where: {
        tableId,
      },
      include: {
        waiter: true,
      },
    })

    // Create the call
    const call = await prisma.call.create({
      data: {
        restaurantId,
        tableId,
        waiterId: waiterTable?.waiterId || null,
        status: 'PENDING',
      },
      include: {
        table: true,
        waiter: true,
      },
    })

    return NextResponse.json(call, { status: 201 })
  } catch (error) {
    console.error('Error creating call:', error)
    return NextResponse.json(
      { error: 'Failed to create call' },
      { status: 500 }
    )
  }
}

// Get calls for a restaurant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing restaurantId' },
        { status: 400 }
      )
    }

    const calls = await prisma.call.findMany({
      where: {
        restaurantId,
        ...(status && { status: status as any }),
      },
      include: {
        table: true,
        waiter: true,
      },
      orderBy: {
        requestedAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(calls)
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}

