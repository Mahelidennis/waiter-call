import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Get table info by QR code (public endpoint for customer QR pages)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params

    const table = await prisma.table.findUnique({
      where: { qrCode },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
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

