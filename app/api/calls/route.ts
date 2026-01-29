import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendCallNotification } from '@/lib/push/sending'

// Configuration for call timeout SLA
const CALL_TIMEOUT_MINUTES = 2 // Configurable SLA in minutes

// Create a new waiter call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableId, restaurantId } = body

    console.log('POST /api/calls - Request body:', body)

    if (!tableId || !restaurantId) {
      console.error('Missing required fields:', { tableId, restaurantId })
      return NextResponse.json(
        { error: 'Missing tableId or restaurantId' },
        { status: 400 }
      )
    }

    console.log('Looking up table:', { tableId, restaurantId })

    // Verify table exists and belongs to restaurant
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId,
        isActive: true,
      },
    })

    console.log('Table found:', table)

    if (!table) {
      console.error('Table not found:', { tableId, restaurantId })
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    console.log('Looking up waiter assignments for table:', tableId)

    // Get assigned waiter for this table (if any)
    const waiterTable = await prisma.waiterTable.findFirst({
      where: {
        tableId,
      },
      include: {
        waiter: true,
      },
    })

    console.log('Waiter assignment found:', waiterTable)

    // Calculate timeout timestamp for SLA
    const now = new Date()
    const timeoutAt = new Date(now.getTime() + CALL_TIMEOUT_MINUTES * 60 * 1000)

    console.log('Creating call with data:', {
      restaurantId,
      tableId,
      waiterId: waiterTable?.waiterId || null,
      status: 'PENDING',
      timeoutAt
    })

    // Create the call with enhanced lifecycle tracking
    console.log('About to create call with data:', {
      restaurantId: typeof restaurantId,
      tableId: typeof tableId,
      waiterId: typeof (waiterTable?.waiterId || null),
      status: 'PENDING',
      timeoutAt: typeof timeoutAt
    })
    
    const call = await prisma.call.create({
      data: {
        restaurantId,
        tableId,
        waiterId: waiterTable?.waiterId || null,
        status: 'PENDING',
        timeoutAt, // Set SLA timeout
        // Legacy field for backward compatibility
        responseTime: null,
      },
      include: {
        table: true,
        waiter: true,
      },
    })

    console.log('Call created successfully:', call)

    // Send push notification to assigned waiter(s)
    // This is non-blocking - failures won't affect call creation
    sendCallNotification(
      call.id,
      table.number,
      restaurantId,
      waiterTable?.waiterId
    ).catch((error) => {
      // Log push notification errors but don't fail the request
      console.error('Push notification failed:', error)
    })

    return NextResponse.json(call, { status: 201 })
  } catch (error) {
    console.error('Error creating call:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Log Prisma-specific error details
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma Error Code:', (error as any).code)
      console.error('Prisma Error Meta:', (error as any).meta)
      console.error('Prisma Error Message:', (error as any).message)
    }
    
    return NextResponse.json(
      { error: 'Failed to create call' },
      { status: 500 }
    )
  }
}

// Get calls for a restaurant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing restaurantId' },
        { status: 400 }
      )
    }

    // First, check for any timed-out calls and mark them as missed
    // This ensures missed-call detection runs on both read and write operations
    await checkAndUpdateMissedCalls(restaurantId)

    const calls = await prisma.call.findMany({
      where: {
        restaurantId,
        ...(status && { status: status as any }),
      },
      include: {
        table: true,
        waiter: true,
      },
      orderBy: [
        // Priority order: PENDING calls first, then by creation time
        { status: 'asc' }, // PENDING comes before MISSED/COMPLETED
        { requestedAt: 'desc' }, // Newest first within same status
      ],
      take: 50,
    })

    return NextResponse.json(calls)
  } catch (error) {
    console.error('Error fetching calls:', error)
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










