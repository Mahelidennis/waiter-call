import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Get a waiter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ waiterId: string }> }
) {
  try {
    const { waiterId } = await params

    const waiter = await prisma.waiter.findUnique({
      where: { id: waiterId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
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

    if (!waiter) {
      return NextResponse.json(
        { error: 'Waiter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(waiter)
  } catch (error) {
    console.error('Error fetching waiter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waiter' },
      { status: 500 }
    )
  }
}

// Update a waiter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ waiterId: string }> }
) {
  try {
    const { waiterId } = await params
    const body = await request.json()
    const { name, email, phone, isActive } = body

    const waiter = await prisma.waiter.findUnique({
      where: { id: waiterId },
    })

    if (!waiter) {
      return NextResponse.json(
        { error: 'Waiter not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.waiter.update({
      where: { id: waiterId },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating waiter:', error)
    return NextResponse.json(
      { error: 'Failed to update waiter' },
      { status: 500 }
    )
  }
}

// Delete a waiter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ waiterId: string }> }
) {
  try {
    const { waiterId } = await params

    const waiter = await prisma.waiter.findUnique({
      where: { id: waiterId },
    })

    if (!waiter) {
      return NextResponse.json(
        { error: 'Waiter not found' },
        { status: 404 }
      )
    }

    await prisma.waiter.delete({
      where: { id: waiterId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting waiter:', error)
    return NextResponse.json(
      { error: 'Failed to delete waiter' },
      { status: 500 }
    )
  }
}
