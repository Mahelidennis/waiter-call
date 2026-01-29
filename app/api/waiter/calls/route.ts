import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

// Get calls for the authenticated waiter
export async function GET(request: NextRequest) {
  try {
    // Authenticate and get waiter info
    const waiter = await requireWaiterSession()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'acknowledged', 'in_progress', 'missed', 'completed', 'all'
    
    // First, check for any timed-out calls and mark them as missed
    // This ensures missed-call detection runs on both read and write operations
    await checkAndUpdateMissedCalls(waiter.restaurantId)
    
    // Get waiter's assigned tables
    const waiterTables = await prisma.waiterTable.findMany({
      where: { waiterId: waiter.id },
      select: { tableId: true }
    })
    
    const assignedTableIds = waiterTables.map(wt => wt.tableId)
    
    // Build where clause for enhanced lifecycle
    let whereClause: any = {
      restaurantId: waiter.restaurantId,
      tableId: { in: assignedTableIds }
    }
    
    // Handle different status filters based on enhanced lifecycle
    if (status === 'pending') {
      // PENDING calls (not yet acknowledged)
      whereClause.status = 'PENDING'
      whereClause.waiterId = null
    } else if (status === 'acknowledged') {
      // ACKNOWLEDGED calls (waiter accepted but not in progress)
      whereClause.status = 'ACKNOWLEDGED'
      whereClause.waiterId = waiter.id
    } else if (status === 'in_progress') {
      // IN_PROGRESS calls (waiter is on the way)
      whereClause.status = 'IN_PROGRESS'
      whereClause.waiterId = waiter.id
    } else if (status === 'missed') {
      // MISSED calls (timeout elapsed)
      whereClause.status = 'MISSED'
      whereClause.waiterId = waiter.id
    } else if (status === 'completed') {
      // COMPLETED calls (service delivered)
      whereClause.status = { in: ['COMPLETED', 'HANDLED'] } // Include legacy HANDLED for backward compatibility
      whereClause.waiterId = waiter.id
    } else if (status === 'my') {
      // All active calls for this waiter (acknowledged + in_progress)
      whereClause.status = { in: ['ACKNOWLEDGED', 'IN_PROGRESS'] }
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
      orderBy: [
        // Priority order: PENDING calls first, then by creation time
        { status: 'asc' }, // PENDING comes before MISSED/COMPLETED
        { requestedAt: 'desc' }, // Newest first within same status
      ],
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

/**
 * Checks for timed-out calls and marks them as MISSED
 * This function is idempotent and can be called safely on any request
 */
async function checkAndUpdateMissedCalls(restaurantId: string) {
  const now = new Date()
  
  // Find all PENDING calls that have exceeded their timeout
  const timedOutCalls = await prisma.call.findMany({
    where: {
      restaurantId,
      status: 'PENDING',
      timeoutAt: {
        lt: now, // timeoutAt is in the past
      },
      missedAt: null, // Not already marked as missed
    },
    select: {
      id: true,
      requestedAt: true,
    },
  })

  // Mark each timed-out call as MISSED
  for (const call of timedOutCalls) {
    await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'MISSED',
        missedAt: now,
        // Calculate response time for analytics (time until missed)
        responseTime: Math.floor(now.getTime() - call.requestedAt.getTime()),
      },
    })
  }

  return timedOutCalls.length
}
