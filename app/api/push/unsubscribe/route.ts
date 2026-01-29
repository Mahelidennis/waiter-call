import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

// Feature flag for push notifications
const PUSH_ENABLED = process.env.PUSH_ENABLED === 'true'

interface UnsubscribeRequest {
  endpoint?: string
  subscriptionId?: string
}

/**
 * POST /api/push/unsubscribe
 * 
 * Remove a push subscription for the authenticated waiter.
 * Can remove by endpoint or subscription ID.
 * This endpoint only removes subscription data - it does NOT send notifications.
 * 
 * Security:
 * - Requires authenticated waiter session
 * - Enforces restaurant scoping (waiter can only remove their own subscriptions)
 * - Validates payload structure
 * - Safe removal with proper error handling
 */
export async function POST(request: NextRequest) {
  // Feature flag check
  if (!PUSH_ENABLED) {
    return NextResponse.json(
      { error: 'Push notifications are not enabled' },
      { status: 503 }
    )
  }

  try {
    // Authenticate waiter
    const waiter = await requireWaiterSession()

    // Parse and validate request body
    const body: UnsubscribeRequest = await request.json()
    
    // Validate that at least one identifier is provided
    if (!body.endpoint && !body.subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required field: endpoint or subscriptionId' },
        { status: 400 }
      )
    }

    let deletedSubscription = null

    // Remove by subscription ID (preferred method)
    if (body.subscriptionId) {
      deletedSubscription = await prisma.pushSubscription.deleteMany({
        where: {
          id: body.subscriptionId,
          waiterId: waiter.id // Ensure waiter can only delete their own subscriptions
        }
      })
    }
    // Remove by endpoint (fallback method)
    else if (body.endpoint) {
      // Validate endpoint format
      try {
        new URL(body.endpoint)
      } catch {
        return NextResponse.json(
          { error: 'Invalid endpoint URL format' },
          { status: 400 }
        )
      }

      deletedSubscription = await prisma.pushSubscription.deleteMany({
        where: {
          endpoint: body.endpoint,
          waiterId: waiter.id // Ensure waiter can only delete their own subscriptions
        }
      })
    }

    if (!deletedSubscription || deletedSubscription.count === 0) {
      return NextResponse.json(
        { error: 'No subscription found to remove' },
        { status: 404 }
      )
    }

    console.log('Push subscription removed', {
      waiterId: waiter.id,
      restaurantId: waiter.restaurantId,
      method: body.subscriptionId ? 'subscriptionId' : 'endpoint',
      identifier: body.subscriptionId || body.endpoint?.substring(0, 50) + '...'
    })

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed successfully',
      deletedCount: deletedSubscription.count
    })

  } catch (error) {
    console.error('Push unsubscribe error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/push/unsubscribe
 * 
 * Get all subscriptions for the authenticated waiter.
 * This helps with debugging and subscription management.
 */
export async function GET(request: NextRequest) {
  // Feature flag check
  if (!PUSH_ENABLED) {
    return NextResponse.json({
      enabled: false,
      subscriptions: [],
      message: 'Push notifications are not enabled'
    })
  }

  try {
    // Authenticate waiter
    const waiter = await requireWaiterSession()

    // Get all subscriptions for this waiter
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        waiterId: waiter.id
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true
      },
      orderBy: {
        lastUsedAt: 'desc'
      }
    })

    return NextResponse.json({
      enabled: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint,
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        lastUsedAt: sub.lastUsedAt
      })),
      count: subscriptions.length
    })

  } catch (error) {
    console.error('Push subscriptions list error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    )
  }
}
