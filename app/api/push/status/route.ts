import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

// Feature flag for push notifications
const PUSH_ENABLED = process.env.PUSH_ENABLED === 'true'

/**
 * GET /api/push/status
 * 
 * Check push notification status for the authenticated waiter.
 * Returns whether push notifications are enabled and if the current device is subscribed.
 * 
 * Security:
 * - Requires authenticated waiter session
 * - Returns only subscription status, no sensitive data
 * - Safe for production use
 */
export async function GET(request: NextRequest) {
  // Feature flag check
  if (!PUSH_ENABLED) {
    return NextResponse.json({
      enabled: false,
      subscribed: false,
      message: 'Push notifications are not enabled'
    })
  }

  try {
    // Authenticate waiter
    const waiter = await requireWaiterSession()

    // Get user agent from request headers
    const userAgent = request.headers.get('user-agent') || undefined

    // Check for existing subscription with matching user agent
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        waiterId: waiter.id,
        userAgent: userAgent
      },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
        lastUsedAt: true
      }
    })

    // Get total subscription count for this waiter
    const totalSubscriptions = await prisma.pushSubscription.count({
      where: {
        waiterId: waiter.id
      }
    })

    return NextResponse.json({
      enabled: true,
      subscribed: !!existingSubscription,
      currentDevice: existingSubscription ? {
        id: existingSubscription.id,
        endpoint: existingSubscription.endpoint,
        createdAt: existingSubscription.createdAt,
        lastUsedAt: existingSubscription.lastUsedAt
      } : null,
      totalSubscriptions,
      message: existingSubscription 
        ? 'Device is subscribed to push notifications' 
        : 'Device is not subscribed to push notifications'
    })

  } catch (error) {
    console.error('Push status check error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check push notification status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/push/status
 * 
 * Test push notification functionality (development only).
 * This endpoint does NOT send actual push notifications - it only tests the subscription system.
 * 
 * Security:
 * - Requires authenticated waiter session
 * - Only works in development environment
 * - Safe for production (no-op)
 */
export async function POST(request: NextRequest) {
  // Feature flag check
  if (!PUSH_ENABLED) {
    return NextResponse.json(
      { error: 'Push notifications are not enabled' },
      { status: 503 }
    )
  }

  // Development only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    // Authenticate waiter
    const waiter = await requireWaiterSession()

    // Get user agent from request headers
    const userAgent = request.headers.get('user-agent') || undefined

    // Check for existing subscription
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        waiterId: waiter.id,
        userAgent: userAgent
      },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
        lastUsedAt: true
      }
    })

    // Update lastUsedAt to simulate usage
    if (existingSubscription) {
      await prisma.pushSubscription.update({
        where: {
          id: existingSubscription.id
        },
        data: {
          lastUsedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      test: 'subscription_check',
      enabled: true,
      subscribed: !!existingSubscription,
      subscription: existingSubscription,
      message: existingSubscription 
        ? 'Push subscription test successful' 
        : 'No push subscription found for this device'
    })

  } catch (error) {
    console.error('Push test error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to test push notification functionality' },
      { status: 500 }
    )
  }
}
