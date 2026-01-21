import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  generateNumericAccessCode,
  hashAccessCode,
} from '@/lib/auth/waiterAccess'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params

    const waiters = await prisma.waiter.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
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

    // Ensure the restaurant exists before creating a waiter to avoid FK errors.
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    const accessCode = generateNumericAccessCode()
    const accessCodeHash = await hashAccessCode(accessCode)

    const waiter = await prisma.waiter.create({
      data: {
        restaurantId,
        name,
        email: email || null,
        phone: phone || null,
        isActive: true,
        accessCodeHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        restaurantId: true,
      },
    })

    return NextResponse.json(
      { waiter, accessCode },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Error creating waiter:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create waiter'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
