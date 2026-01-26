import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

// Get calls for the authenticated waiter
export async function GET(request: NextRequest) {
  try {
    // Authenticate and get waiter info
    const waiter = await requireWaiterSession()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'acknowledged', 'handled', 'all'
    
    // Get waiter's assigned tables
    const waiterTables = await prisma.waiterTable.findMany({
      where: { waiterId: waiter.id },
      select: { tableId: true }
    })
    
    const assignedTableIds = waiterTables.map(wt => wt.tableId)
    
    // Build where clause
    let whereClause: any = {
      restaurantId: waiter.restaurantId,
      tableId: { in: assignedTableIds }
    }
    
    // Handle different status filters based on lifecycle
    if (status === 'pending') {
      // PENDING calls (not yet acknowledged)
      whereClause.status = 'PENDING'
      whereClause.waiterId = null
    } else if (status === 'acknowledged') {
      // Acknowledged calls (PENDING but with waiterId assigned)
      whereClause.status = 'PENDING'
      whereClause.waiterId = waiter.id
    } else if (status === 'handled') {
      // HANDLED calls (resolved)
      whereClause.status = 'HANDLED'
    } else if (status === 'my') {
      // All calls for this waiter (acknowledged + handled)
      whereClause.waiterId = waiter.id
    } else if (status !== 'all') {
      // Default to pending if invalid status
      whereClause.status = 'PENDING'
      whereClause.waiterId = null
    }
    
    const calls = await prisma.call.findMany({
      where: whereClause,
      include: {
        table: {
          select: {
            id: true,
            number: true
          }
        },
        waiter: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      },
      take: 50
    })
    
    return NextResponse.json(calls)
  } catch (error: any) {
    console.error('Error fetching waiter calls:', error)
    
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INACTIVE_WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}
