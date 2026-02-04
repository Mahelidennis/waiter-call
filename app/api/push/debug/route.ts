import { NextResponse, NextRequest } from 'next/server'
import { sendCallNotification } from '@/lib/push/sending'
import { prisma } from '@/lib/db'

/**
 * Test push notification flow
 * This endpoint helps debug why waiters aren't receiving notifications
 */
export async function POST(request: NextRequest) {
  console.log('🔔 PUSH TEST: Starting push notification test')
  
  try {
    // Get first active waiter for testing
    const waiter = await prisma.waiter.findFirst({
      where: {
        isActive: true
      },
      include: {
        restaurant: true
      }
    })

    if (!waiter) {
      console.log('🔔 PUSH TEST: No active waiters found')
      return NextResponse.json({
        success: false,
        error: 'No active waiters found'
      })
    }

    console.log('🔔 PUSH TEST: Found test waiter', {
      waiterId: waiter.id,
      name: waiter.name,
      restaurantId: waiter.restaurantId
    })

    // Check push subscriptions for this waiter
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        waiterId: waiter.id
      }
    })

    console.log('🔔 PUSH TEST: Found subscriptions', {
      waiterId: waiter.id,
      subscriptionCount: subscriptions.length,
      endpoints: subscriptions.map(s => s.endpoint.substring(0, 50) + '...')
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No push subscriptions found for waiter',
        waiterId: waiter.id,
        waiterName: waiter.name
      })
    }

    // Send test notification
    const result = await sendCallNotification(
      'test-call-' + Date.now(),
      'TEST-TABLE',
      waiter.restaurantId,
      waiter.id
    )

    console.log('🔔 PUSH TEST: Send result', result)

    return NextResponse.json({
      success: true,
      waiter: {
        id: waiter.id,
        name: waiter.name,
        restaurantId: waiter.restaurantId
      },
      subscriptionCount: subscriptions.length,
      pushResult: result,
      testCallId: 'test-call-' + Date.now()
    })

  } catch (error) {
    console.error('🔔 PUSH TEST: Error', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Check push notification configuration
 */
export async function GET() {
  console.log('🔔 PUSH TEST: Checking push configuration')
  
  const pushEnabled = process.env.PUSH_ENABLED === 'true'
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  console.log('🔔 PUSH TEST: Configuration', {
    PUSH_ENABLED: pushEnabled,
    VAPID_PUBLIC_KEY: !!vapidPublicKey,
    VAPID_PRIVATE_KEY: !!vapidPrivateKey,
    VAPID_PUBLIC_KEY_LENGTH: vapidPublicKey?.length,
    VAPID_PRIVATE_KEY_LENGTH: vapidPrivateKey?.length
  })

  // Count active waiters and subscriptions
  const activeWaiters = await prisma.waiter.count({
    where: {
      isActive: true
    }
  })

  const totalSubscriptions = await prisma.pushSubscription.count()

  const subscriptionsByWaiter = await prisma.pushSubscription.groupBy({
    by: ['waiterId'],
    _count: {
      id: true
    }
  })

  console.log('🔔 PUSH TEST: Database stats', {
    activeWaiters,
    totalSubscriptions,
    subscriptionsByWaiter
  })

  return NextResponse.json({
    configuration: {
      PUSH_ENABLED: pushEnabled,
      VAPID_PUBLIC_KEY: !!vapidPublicKey,
      VAPID_PRIVATE_KEY: !!vapidPrivateKey,
      VAPID_PUBLIC_KEY_LENGTH: vapidPublicKey?.length,
      VAPID_PRIVATE_KEY_LENGTH: vapidPrivateKey?.length
    },
    database: {
      activeWaiters,
      totalSubscriptions,
      subscriptionsByWaiter
    }
  })
}
