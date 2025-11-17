import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Update a table
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params
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

// Delete a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params

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

