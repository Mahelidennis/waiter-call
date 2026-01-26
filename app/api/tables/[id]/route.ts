import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Helper to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Get table info by QR code or ID (public endpoint for customer QR pages)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Determine if it's a UUID (table ID) or QR code
    const isTableId = isUUID(id)
    
    const table = await prisma.table.findUnique({
      where: isTableId ? { id } : { qrCode: id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            menuUrl: true,
          },
        },
        assignedWaiters: {
          include: {
            waiter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!table || !table.isActive) {
      return NextResponse.json(
        { error: 'Table not found or inactive' },
        { status: 404 }
      )
    }

    // Get active promotions for this restaurant
    const promotions = await prisma.promotion.findMany({
      where: {
        restaurantId: table.restaurantId,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } },
        ],
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        ],
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return NextResponse.json({
      table: {
        id: table.id,
        number: table.number,
        restaurant: table.restaurant,
      },
      promotions,
    })
  } catch (error) {
    console.error('Error fetching table:', error)
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 }
    )
  }
}

// Update a table (by ID only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params
    const body = await request.json()
    const { number, isActive } = body

    const table = await prisma.table.findUnique({
      where: { id: tableId },
    })

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    // Check if new number conflicts with existing table
    if (number && number !== table.number) {
      const existing = await prisma.table.findFirst({
        where: {
          restaurantId: table.restaurantId,
          number,
          id: { not: tableId },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Table number already exists' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: {
        ...(number && { number }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    )
  }
}

// Delete a table (by ID only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params

    const table = await prisma.table.findUnique({
      where: { id: tableId },
    })

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    await prisma.table.delete({
      where: { id: tableId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    )
  }
}
