import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Assign tables to a waiter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ waiterId: string }> }
) {
  try {
    const { waiterId } = await params
    const body = await request.json()
    const { tableIds } = body

    if (!Array.isArray(tableIds)) {
      return NextResponse.json(
        { error: 'tableIds must be an array' },
        { status: 400 }
      )
    }

    // Verify waiter exists
    const waiter = await prisma.waiter.findUnique({
      where: { id: waiterId },
    })

    if (!waiter) {
      return NextResponse.json(
        { error: 'Waiter not found' },
        { status: 404 }
      )
    }

    // Remove existing assignments
    await prisma.waiterTable.deleteMany({
      where: { waiterId },
    })

    // Create new assignments
    const assignments = await Promise.all(
      tableIds.map((tableId: string) =>
        prisma.waiterTable.create({
          data: {
            waiterId,
            tableId,
          },
        })
      )
    )

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error assigning tables:', error)
    return NextResponse.json(
      { error: 'Failed to assign tables' },
      { status: 500 }
    )
  }
}










