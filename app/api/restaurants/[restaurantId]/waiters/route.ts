import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params

    const waiters = await prisma.waiter.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
      include: {
        assignedTables: {
          include: {
            table: {
              select: {
                id: true,
                number: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(waiters)
  } catch (error) {
    console.error('Error fetching waiters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waiters' },
      { status: 500 }
    )
  }
}

// Create a new waiter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const body = await request.json()
    const { name, email, phone } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Waiter name is required' },
        { status: 400 }
      )
    }

    const waiter = await prisma.waiter.create({
      data: {
        restaurantId,
        name,
        email: email || null,
        phone: phone || null,
        isActive: true,
      },
    })

    return NextResponse.json(waiter, { status: 201 })
  } catch (error) {
    console.error('Error creating waiter:', error)
    return NextResponse.json(
      { error: 'Failed to create waiter' },
      { status: 500 }
    )
  }
}
