import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendCallNotification } from '@/lib/push/sending'
import { requireAdmin, requireWaiter, getAuthenticatedUser } from '@/lib/auth/server'
import { CallStatus, normalizeStatus, isValidStatusTransition, getStatusForFilter } from '@/lib/constants/callStatus'
import { validateRequestBody, SCHEMAS, ValidationException, RATE_LIMITERS, getClientKey } from '@/lib/validation/inputValidation'
import { performanceMonitor as performanceMonitorDecorator, globalPerformanceMonitor, PerformanceTimer } from '@/lib/monitoring/performanceMonitor'
import { logPerformance, logError, logWarn, logInfo } from '@/lib/monitoring/logger'

// Configuration for call timeout SLA
const CALL_TIMEOUT_MINUTES = 2 // Configurable SLA in minutes
const TRANSACTION_TIMEOUT = 10000 // 10 seconds
const NOTIFICATION_RETRY_ATTEMPTS = 2 // Number of retry attempts for failed notifications

// Create a new waiter call
export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer('api_call_create')

  try {
    // Rate limiting check
    const clientKey = getClientKey(request)
    if (!RATE_LIMITERS.callCreation.isAllowed(clientKey)) {
      const remainingAttempts = RATE_LIMITERS.callCreation.getRemainingAttempts(clientKey)
      const resetTime = RATE_LIMITERS.callCreation.getResetTime(clientKey)
      
      logWarn('Rate limit exceeded for call creation', 'RATE_LIMITING', {
        clientKey,
        remainingAttempts,
        resetTime: resetTime ? new Date(resetTime).toISOString() : null
      })
      
      timer.end({ success: false, reason: 'rate_limit_exceeded' })
      
      return NextResponse.json({
        error: 'Too many call creation attempts',
        details: {
          remainingAttempts,
          resetTime: resetTime ? new Date(resetTime).toISOString() : null
        }
      }, { status: 429 })
    }

    // Input validation
    logInfo('=== API CALLS DEBUG ===', 'API', {})
    logInfo('Request headers:', 'API', {
      contentType: request.headers.get('content-type'),
      method: request.method
    })
    
    const validationResult = await validateRequestBody(request, SCHEMAS.createCall)
    
    logInfo('Validation result:', 'API', {
      isValid: validationResult.isValid,
      data: validationResult.data,
      errors: validationResult.errors
    })
    logInfo('========================', 'API', {})
    
    if (!validationResult.isValid) {
      timer.end({ success: false, reason: 'validation_failed', errors: validationResult.errors })
      
      logError('Validation failed for call creation', 'API', {
        errors: validationResult.errors
      })
      
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.errors
      }, { status: 400 })
    }

    const { tableId, restaurantId } = validationResult.data!

    logInfo('Creating new call', 'API', {
      tableId,
      restaurantId
    })

    // Authorization: Allow either authenticated admin or customer (no auth required for customer calls)
    // Customer calls are allowed without authentication for public access
    // Admin calls require proper authorization
    const authUser = await getAuthenticatedUser()
    if (authUser) {
      // If authenticated user, verify they have access to this restaurant
      if (authUser.role === 'admin' && authUser.restaurantId !== restaurantId) {
        logError('Admin access denied - wrong restaurant', 'AUTHORIZATION', {
          userRestaurantId: authUser.restaurantId, 
          requestedRestaurantId: restaurantId,
          userId: authUser.user.id
        })
        
        timer.end({ success: false, reason: 'access_denied' })
        
        return NextResponse.json(
          { error: 'Unauthorized - restaurant access denied' },
          { status: 403 }
        )
      }
      
      if (authUser.role === 'waiter' && authUser.restaurantId !== restaurantId) {
        logError('Waiter access denied - wrong restaurant', 'AUTHORIZATION', {
          userRestaurantId: authUser.restaurantId, 
          requestedRestaurantId: restaurantId,
          userId: authUser.user.id
        })
        
        timer.end({ success: false, reason: 'access_denied' })
        
        return NextResponse.json(
          { error: 'Unauthorized - restaurant access denied' },
          { status: 403 }
        )
      }
    }
    
    logInfo('Authorization passed', 'AUTH', {
      authUser: authUser ? `${authUser.role} (${authUser.user.id})` : 'anonymous customer'
    })

    logInfo('Looking up table', 'DATABASE', {
      tableId,
      restaurantId
    })

    // Verify table exists and belongs to restaurant
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId,
        isActive: true,
      },
    })

    if (!table) {
      logError('Table not found', 'DATABASE', {
        tableId,
        restaurantId
      })
      
      timer.end({ success: false, reason: 'table_not_found' })
      
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    logInfo('Looking up waiter assignments for table', 'DATABASE', {
      tableId
    })

    // Get assigned waiter for this table (if any)
    const waiterTable = await prisma.waiterTable.findFirst({
      where: {
        tableId,
      },
      include: {
        waiter: true,
      },
    })

    logInfo('Waiter assignment found', 'DATABASE', {
      waiterTable: waiterTable ? 'yes' : 'no',
      waiterId: waiterTable?.waiterId || 'unassigned'
    })

    // Calculate timeout timestamp for SLA (stored in memory, not DB until schema is updated)
    const now = new Date()
    const timeoutAt = new Date(now.getTime() + CALL_TIMEOUT_MINUTES * 60 * 1000)

    logInfo('Creating call with transaction', 'DATABASE', {
      restaurantId,
      tableId,
      waiterId: waiterTable?.waiterId || null,
      status: 'PENDING',
      timeoutAt: 'CALCULATED_BUT_NOT_STORED', // Database doesn't have this column yet
      callStatusEnum: CallStatus.PENDING,
      callStatusType: typeof CallStatus.PENDING
    })

    // Create the call within a transaction for atomicity
    // This ensures that either:
    // 1. Call is created AND notification is attempted (with retries)
    // 2. Neither happens if there's a database error
    // 
    // Note: We don't rollback on notification failures because:
    // - The call is still valuable (can be seen via polling/realtime)
    // - Push notifications are best-effort (devices might be offline)
    // - Rolling back would lose the customer's request entirely
    
    logInfo('Starting Prisma transaction', 'DATABASE', {
      timeout: TRANSACTION_TIMEOUT
    })
    
    const call = await prisma.$transaction(async (tx) => {
      logInfo('Inside transaction - creating call', 'DATABASE', {
        restaurantId,
        tableId,
        waiterId: waiterTable?.waiterId || null,
        status: CallStatus.PENDING,
        timeoutAt: 'NOT_STORED_IN_DB' // Database doesn't have this column yet
      })
      
      try {
        // Create the call with enhanced lifecycle tracking
        const newCall = await tx.call.create({
          data: {
            restaurantId,
            tableId,
            waiterId: waiterTable?.waiterId || null,
            status: CallStatus.PENDING, // Use standardized status
            timeoutAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute timeout
            // Legacy field for backward compatibility
            responseTime: null,
          },
          include: {
            table: true,
            waiter: true,
          },
        })
        
        logInfo('Call created successfully within transaction', 'DATABASE', {
          callId: newCall.id,
          callStatus: newCall.status,
          callRestaurantId: newCall.restaurantId,
          callTableId: newCall.tableId
        })

        // Send push notification to assigned waiter(s)
        // This is now within the transaction context for better error handling
        try {
          const notificationResult = await sendCallNotification(
            newCall.id,
            table.number,
            restaurantId,
            waiterTable?.waiterId
          )
          
          logInfo('Push notification result', 'NOTIFICATION', {
            callId: newCall.id,
            success: notificationResult.success,
            sent: notificationResult.sent,
            failed: notificationResult.failed,
            invalidSubscriptions: notificationResult.invalidSubscriptions?.length || 0
          })
          
          // If push notifications are completely disabled, that's acceptable
          // If they're enabled but all failed, we still consider the call successful
          // (the call exists in the system and can be seen via polling)
          
        } catch (notificationError) {
          // Log notification error but don't fail the transaction
          // The call is still created and can be seen via polling/realtime
          logError('Push notification failed (non-critical)', 'NOTIFICATION', {
            callId: newCall.id,
            error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
          })
        }

        return newCall
      } catch (createError) {
        logError('Call creation failed inside transaction', 'DATABASE', {
          errorMessage: createError instanceof Error ? createError.message : 'Unknown error',
          errorStack: createError instanceof Error ? createError.stack : undefined,
          errorCode: (createError as any)?.code,
          errorMeta: (createError as any)?.meta
        })
        throw createError // Re-throw to fail the transaction
      }
    }, {
      timeout: TRANSACTION_TIMEOUT,
    })

    logInfo('Transaction completed successfully', 'DATABASE', {
      callId: call.id
    })

    timer.end({ 
      success: true,
      callId: call.id,
      tableId: call.tableId,
      restaurantId: call.restaurantId,
      waiterId: call.waiterId
    })

    return NextResponse.json(call, { status: 201 })
  } catch (error) {
    timer.end({ success: false, reason: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
    
    // Enhanced error logging - log the FULL error object first
    logError('=== DATABASE ERROR DETAILS ===', 'DATABASE', {
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorCode: (error as any)?.code,
      errorMeta: (error as any)?.meta,
      errorTarget: (error as any)?.target,
      fullErrorObject: error
    })
    logError('===============================', 'DATABASE', {})
    
    logError('Error creating call', 'API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Check if this is a transaction timeout error
    if (error instanceof Error && error.message.includes('transaction')) {
      logError('Transaction failed - timeout or deadlock', 'DATABASE')
      return NextResponse.json(
        { error: 'System busy - please try again' },
        { status: 503 }
      )
    }
    
    // Log Prisma-specific error details
    if (error && typeof error === 'object' && 'code' in error) {
      logError('Database error occurred', 'DATABASE', {
        code: (error as any).code,
        meta: (error as any).meta,
        message: (error as any).message
      })
      
      // Handle specific database errors
      switch ((error as any).code) {
        case 'P2002':
          // Unique constraint violation
          return NextResponse.json(
            { error: 'Duplicate call request' },
            { status: 409 }
          )
        case 'P2025':
          // Record not found
          return NextResponse.json(
            { error: 'Table or restaurant not found' },
            { status: 404 }
          )
        case 'P2003':
          // Foreign key constraint violation
          return NextResponse.json(
            { error: 'Invalid table or restaurant reference' },
            { status: 400 }
          )
        default:
          // Other database errors
          return NextResponse.json(
            { error: 'Database operation failed' },
            { status: 500 }
          )
      }
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

    // Authorization: Require authenticated user (admin or waiter) with access to this restaurant
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      console.error('Unauthorized access attempt - no authentication')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user has access to this restaurant
    if (authUser.restaurantId !== restaurantId) {
      console.error('Access denied - wrong restaurant:', { 
        userRestaurantId: authUser.restaurantId, 
        requestedRestaurantId: restaurantId,
        userId: authUser.user.id,
        role: authUser.role
      })
      return NextResponse.json(
        { error: 'Unauthorized - restaurant access denied' },
        { status: 403 }
      )
    }

    console.log('Authorization passed for GET calls:', { 
      role: authUser.role, 
      userId: authUser.user.id,
      restaurantId 
    })

    // First, check for any timed-out calls and mark them as missed
    // This ensures missed-call detection runs on both read and write operations
    await checkAndUpdateMissedCalls(restaurantId)

    const calls = await prisma.call.findMany({
      where: {
        restaurantId,
        ...(status && { 
          status: { in: getStatusForFilter(status) }
        }),
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

    // Standardize the response
    const standardizedCalls = calls.map(call => ({
      ...call,
      normalizedStatus: normalizeStatus(call.status),
      isActive: [CallStatus.PENDING, CallStatus.ACKNOWLEDGED, CallStatus.IN_PROGRESS].includes(normalizeStatus(call.status) as CallStatus),
      isTerminal: [CallStatus.COMPLETED, CallStatus.MISSED, CallStatus.CANCELLED, CallStatus.HANDLED].includes(normalizeStatus(call.status) as CallStatus)
    }))

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
 * NOTE: Timeout checking disabled until database schema is updated with timeoutAt column
 */
async function checkAndUpdateMissedCalls(restaurantId: string) {
  // TODO: Re-enable timeout checking once database schema includes timeoutAt column
  // For now, we'll skip timeout checking to avoid database errors
  
  console.log('Timeout checking disabled - database schema missing timeoutAt column')
  
  return 0 // Return 0 timed-out calls found
  
  /*
  // Original timeout logic (disabled until schema update):
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
  */
}










