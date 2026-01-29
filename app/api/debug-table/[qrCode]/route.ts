import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Debug endpoint to check table and waiter assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params
    
    console.log('Debugging table with QR code:', qrCode)

    // Find table by QR code
    const table = await prisma.table.findUnique({
      where: { qrCode },
      include: {
        restaurant: true,
        assignedWaiters: {
          include: {
            waiter: true
          }
        }
      }
    })

    console.log('Table found:', table)

    if (!table) {
      return NextResponse.json({
        error: 'Table not found',
        qrCode,
        message: `No table found with QR code: ${qrCode}`
      })
    }

    // Check if table is active
    if (!table.isActive) {
      return NextResponse.json({
        error: 'Table is inactive',
        table: {
          id: table.id,
          number: table.number,
          qrCode: table.qrCode,
          isActive: table.isActive
        }
      })
    }

    // Check waiter assignments
    const waiterAssignments = table.assignedWaiters
    console.log('Waiter assignments:', waiterAssignments)

    return NextResponse.json({
      success: true,
      table: {
        id: table.id,
        number: table.number,
        qrCode: table.qrCode,
        isActive: table.isActive,
        restaurant: {
          id: table.restaurant.id,
          name: table.restaurant.name
        }
      },
      waiterAssignments: waiterAssignments.map(wa => ({
        waiterId: wa.waiterId,
        waiterName: wa.waiter.name,
        waiterEmail: wa.waiter.email,
        waiterIsActive: wa.waiter.isActive
      })),
      canCreateCall: {
        hasTable: true,
        tableIsActive: table.isActive,
        hasWaiterAssignment: waiterAssignments.length > 0,
        hasActiveWaiter: waiterAssignments.some(wa => wa.waiter.isActive)
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
