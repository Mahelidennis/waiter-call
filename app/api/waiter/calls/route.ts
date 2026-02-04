import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { CallStatus, normalizeStatus, getStatusForFilter } from '@/lib/constants/callStatus'

// Get calls for the authenticated waiter
export async function GET(request: NextRequest) {
  try {
    // Try session-based authentication first (for waiters)
    let waiter = null
    try {
      waiter = await requireWaiterSession()
    } catch (sessionError: any) {
      // Session auth failed, try JWT auth (for admins or alternative auth)
      console.log('Session auth failed, trying JWT auth:', sessionError?.message || 'Unknown error')
    }
    
    // If session auth failed, try JWT authentication
    if (!waiter) {
      const authUser = await getAuthenticatedUser()
      if (!authUser) {
        console.error('No authentication found - neither session nor JWT')
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      
      // For JWT auth, verify it's a waiter with proper permissions
      if (authUser.role !== 'waiter') {
        console.error('JWT auth failed - not a waiter role:', authUser.role)
        return NextResponse.json({ error: 'Waiter access required' }, { status: 403 })
      }
      
      // Convert JWT user to waiter format
      waiter = {
        id: authUser.waiterId!,
        restaurantId: authUser.restaurantId!,
        name: authUser.user.user_metadata?.name || 'Waiter',
      }
      
      console.log('JWT authentication successful for waiter:', waiter.id)
    } else {
      console.log('Session authentication successful for waiter:', waiter.id)
    }
    
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
    const statusFilters = getStatusForFilter(status)
    
    if (statusFilters.length === 1) {
      // Single status filter
      const filterStatus = statusFilters[0]
      
      if (filterStatus === CallStatus.PENDING) {
        whereClause.status = CallStatus.PENDING
        whereClause.waiterId = waiter.id
      } else if (filterStatus === CallStatus.ACKNOWLEDGED) {
        whereClause.status = CallStatus.ACKNOWLEDGED
        whereClause.waiterId = waiter.id
      } else if (filterStatus === CallStatus.IN_PROGRESS) {
        whereClause.status = CallStatus.IN_PROGRESS
        whereClause.waiterId = waiter.id
      } else if (filterStatus === CallStatus.MISSED) {
        whereClause.status = CallStatus.MISSED
        whereClause.waiterId = waiter.id
      } else if (filterStatus === CallStatus.COMPLETED || filterStatus === CallStatus.HANDLED) {
        // Include both COMPLETED and legacy HANDLED
        whereClause.status = { in: [CallStatus.COMPLETED, CallStatus.HANDLED] }
        whereClause.waiterId = waiter.id
      } else {
        whereClause.status = filterStatus
        whereClause.waiterId = waiter.id
      }
    } else if (statusFilters.includes(CallStatus.ACKNOWLEDGED) && statusFilters.includes(CallStatus.IN_PROGRESS)) {
      // 'my' filter - active calls for this waiter
      whereClause.status = { in: [CallStatus.ACKNOWLEDGED, CallStatus.IN_PROGRESS] }
      whereClause.waiterId = waiter.id
    } else if (statusFilters.length > 1) {
      // Multiple status filter
      whereClause.status = { in: statusFilters }
      whereClause.waiterId = waiter.id
    } else {
      // Default to pending if invalid status
      whereClause.status = CallStatus.PENDING
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
    
    // Standardize the response
    const standardizedCalls = calls.map(call => ({
      ...call,
      normalizedStatus: normalizeStatus(call.status),
      isActive: [CallStatus.PENDING, CallStatus.ACKNOWLEDGED, CallStatus.IN_PROGRESS].includes(normalizeStatus(call.status) as CallStatus),
      isTerminal: [CallStatus.COMPLETED, CallStatus.MISSED, CallStatus.CANCELLED, CallStatus.HANDLED].includes(normalizeStatus(call.status) as CallStatus)
    }))
    
    return NextResponse.json(standardizedCalls)
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
  // TODO: Re-enable timeout checking once database schema includes timeoutAt column
  const timedOutCalls: any[] = [] // Empty array until schema is updated
  
  /*
  // Original timeout logic (disabled until schema update):
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
  */

  // Mark each timed-out call as MISSED
  for (const call of timedOutCalls) {
    await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'MISSED',
        // missedAt removed - database doesn't have this column yet
        // Calculate response time for analytics (time until missed)
        responseTime: Math.floor(now.getTime() - call.requestedAt.getTime()),
      },
    })
  }

  return timedOutCalls.length
}
