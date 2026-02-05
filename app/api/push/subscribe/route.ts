import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

// Feature flag for push notifications
const PUSH_ENABLED = process.env.PUSH_ENABLED === 'true'

interface SubscribeRequest {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}

/**
 * POST /api/push/subscribe
 * 
 * Register or update a push subscription for the authenticated waiter.
 * This endpoint only stores subscription data - it does NOT send notifications.
 * 
 * Security:
 * - Requires authenticated waiter session
 * - Enforces restaurant scoping
 * - Validates payload structure
 * - Idempotent operations (upsert)
 */
export async function POST(request: NextRequest) {
  console.log('🔔 PUSH SUBSCRIPTION: Starting subscription request')
  
  // Feature flag check
  if (!PUSH_ENABLED) {
    console.log('🔔 PUSH SUBSCRIPTION: Push notifications disabled')
    return NextResponse.json(
      { error: 'Push notifications are not enabled' },
      { status: 503 }
    )
  }

  try {
    // Authenticate waiter
    const waiter = await requireWaiterSession()
    console.log('🔔 PUSH SUBSCRIPTION: Authenticated waiter', {
      waiterId: waiter.id,
      waiterName: waiter.name,
      restaurantId: waiter.restaurantId
    })

    // Parse and validate request body
    const body: SubscribeRequest = await request.json()
    console.log('🔔 PUSH SUBSCRIPTION: Subscription data received', {
      endpoint: body.endpoint?.substring(0, 50) + '...',
      hasP256dh: !!body.p256dh,
      hasAuth: !!body.auth,
      userAgent: body.userAgent
    })
    
    // Validate required fields
    if (!body.endpoint || !body.p256dh || !body.auth) {
      return NextResponse.json(
        { error: 'Missing required fields: endpoint, p256dh, auth' },
        { status: 400 }
      )
    }

    // Validate endpoint format (basic validation)
    try {
      new URL(body.endpoint)
    } catch {
      return NextResponse.json(
        { error: 'Invalid endpoint URL format' },
        { status: 400 }
      )
    }

    // Validate p256dh and auth are base64 strings
    try {
      atob(body.p256dh)
      atob(body.auth)
    } catch {
      return NextResponse.json(
        { error: 'Invalid p256dh or auth format (must be base64)' },
        { status: 400 }
      )
    }

    // Store or update subscription (enforces one per waiter)
    console.log('🔔 PUSH SUBSCRIBE: Storing subscription for waiter', waiter.id)
    const userAgent = body.userAgent || request.headers.get('user-agent') || undefined
    
    // First try to delete any existing subscription for this waiter
    await prisma.pushSubscription.deleteMany({
      where: { waiterId: waiter.id }
    })
    
    // Then create the new subscription
    const subscription = await prisma.pushSubscription.create({
      data: {
        waiterId: waiter.id,
        restaurantId: waiter.restaurantId,
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        userAgent,
        createdAt: new Date(),
        lastUsedAt: new Date()
      }
    })

    console.log('🔔 PUSH SUBSCRIPTION: Subscription stored successfully', {
      subscriptionId: subscription.id,
      waiterId: waiter.id,
      endpoint: body.endpoint.substring(0, 50) + '...'
    })

    console.log('Push subscription registered', {
      subscriptionId: subscription.id,
      waiterId: waiter.id,
      restaurantId: waiter.restaurantId,
      endpoint: body.endpoint.substring(0, 50) + '...' // Log partial endpoint for security
    })

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      message: 'Push subscription registered successfully'
    })

  } catch (error) {
    console.error('Push subscription error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to register push subscription' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/push/subscribe
 * 
 * Get current subscription status for the authenticated waiter.
 * Returns whether the device has an active push subscription.
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

    return NextResponse.json({
      enabled: true,
      subscribed: !!existingSubscription,
      subscription: existingSubscription ? {
        id: existingSubscription.id,
        endpoint: existingSubscription.endpoint,
        createdAt: existingSubscription.createdAt,
        lastUsedAt: existingSubscription.lastUsedAt
      } : null
    })

  } catch (error) {
    console.error('Push subscription status error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}
