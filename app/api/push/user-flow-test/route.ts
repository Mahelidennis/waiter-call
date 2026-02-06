import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Simulate the exact user flow for enabling push notifications
 * This tests what happens when a waiter tries to enable notifications
 */
export async function POST() {
  console.log('🧪 USER FLOW TEST: Simulating waiter enabling notifications')
  
  try {
    // Step 1: Get an active waiter (simulate user login)
    const waiter = await prisma.waiter.findFirst({
      where: { isActive: true },
      include: { restaurant: true }
    })

    if (!waiter) {
      return NextResponse.json({
        success: false,
        error: 'No active waiters found - create a waiter first'
      })
    }

    console.log('🧪 USER FLOW: Found waiter', { waiterId: waiter.id, name: waiter.name })

    // Step 2: Simulate browser permission granted
    // In real flow, this would be: await Notification.requestPermission()
    const permission = 'granted' // Simulate granted permission
    console.log('🧪 USER FLOW: Browser permission', permission)

    // Step 3: Simulate service worker registration
    // In real flow, this would be: await navigator.serviceWorker.register('/sw.js')
    console.log('🧪 USER FLOW: Service worker would be registered')

    // Step 4: Simulate push subscription creation
    // In real flow, this would be browser-generated subscription data
    const mockSubscription = {
      endpoint: `https://fcm.googleapis.com/fcm/send/test-${Date.now()}`,
      p256dh: 'BMlT5YxNv_qnTjM8C8JjWJg8VqNjPnLqRkStWbNnK8X9Y2Z3V4W5X6Y7Z8A9B0C1',
      auth: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1'
    }

    console.log('🧪 USER FLOW: Generated mock subscription', {
      endpoint: mockSubscription.endpoint.substring(0, 50) + '...'
    })

    // Step 5: Call the subscribe API (this is what the frontend does)
    try {
      const subscribeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `waiter-session=${waiter.id}` // Simulate authenticated session
        },
        body: JSON.stringify({
          endpoint: mockSubscription.endpoint,
          p256dh: mockSubscription.p256dh,
          auth: mockSubscription.auth
        })
      })

      if (!subscribeResponse.ok) {
        const error = await subscribeResponse.text()
        throw new Error(`Subscribe API failed: ${subscribeResponse.status} - ${error}`)
      }

      const subscribeResult = await subscribeResponse.json()
      console.log('🧪 USER FLOW: Subscribe API response', subscribeResult)

      // Step 6: Verify subscription was saved
      const savedSubscription = await prisma.pushSubscription.findUnique({
        where: { waiterId: waiter.id },
        include: {
          waiter: {
            select: { id: true, name: true }
          }
        }
      })

      console.log('🧪 USER FLOW: Saved subscription', {
        found: !!savedSubscription,
        endpoint: savedSubscription?.endpoint?.substring(0, 50) + '...'
      })

      return NextResponse.json({
        success: true,
        testResults: {
          step1_waiterFound: { success: true, waiter: { id: waiter.id, name: waiter.name } },
          step2_browserPermission: { success: true, permission },
          step3_serviceWorker: { success: true, message: 'Service worker registration simulated' },
          step4_subscriptionData: { success: true, endpoint: mockSubscription.endpoint.substring(0, 50) + '...' },
          step5_subscribeAPI: { success: true, response: subscribeResult },
          step6_verification: { 
            success: !!savedSubscription, 
            subscription: savedSubscription ? {
              id: savedSubscription.id,
              endpoint: savedSubscription.endpoint.substring(0, 50) + '...',
              createdAt: savedSubscription.createdAt
            } : null
          }
        },
        message: 'User flow simulation completed successfully',
        nextSteps: [
          '✅ Subscription API is working',
          '📱 Test real browser flow in waiter dashboard',
          '🧪 Use POST /api/push/test-complete to test push sending'
        ]
      })

    } catch (apiError) {
      console.error('🧪 USER FLOW: Subscribe API error', apiError)
      return NextResponse.json({
        success: false,
        error: `Subscribe API failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        details: {
          waiterId: waiter.id,
          subscriptionData: mockSubscription
        }
      })
    }

  } catch (error) {
    console.error('🧪 USER FLOW: Error', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
