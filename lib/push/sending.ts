/**
 * Push Notification Sending
 * 
 * Handles sending push notifications to waiters when calls are created.
 * Server-side only - uses web-push library with VAPID authentication.
 */

import webpush from 'web-push'
import { prisma } from '@/lib/db'

// Feature flag for push notifications
const PUSH_ENABLED = process.env.PUSH_ENABLED === 'true'

// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'admin@waitercall.app'

// Auto-disable push if VAPID keys are missing
const PUSH_AVAILABLE = PUSH_ENABLED && !!VAPID_PUBLIC_KEY && !!VAPID_PRIVATE_KEY

export interface PushPayload {
  tableNumber: string
  callType: string
  timestamp: string
  callId: string
  restaurantId: string
}

export interface PushResult {
  success: boolean
  sent: number
  failed: number
  invalidSubscriptions: string[]
  errors: Array<{
    subscriptionId: string
    error: string
  }>
}

/**
 * Initialize web-push with VAPID credentials
 * Returns true if initialization successful, false if disabled/missing keys
 */
function initializeWebPush(): boolean {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('VAPID keys not configured, push notifications disabled')
    return false
  }

  try {
    webpush.setVapidDetails(
      `mailto:${VAPID_EMAIL}`,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )
    return true
  } catch (error) {
    console.error('Failed to initialize web-push:', error)
    return false
  }
}

/**
 * Create push notification payload
 */
function createPayload(data: PushPayload): string {
  return JSON.stringify({
    title: 'New Table Call',
    body: `Table ${data.tableNumber} needs assistance`,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: `call-${data.callId}`, // Prevent duplicate notifications
    data: {
      callId: data.callId,
      tableNumber: data.tableNumber,
      restaurantId: data.restaurantId,
      timestamp: data.timestamp,
      url: `/waiter/dashboard` // Deep link to waiter dashboard
    },
    actions: [
      {
        action: 'view',
        title: 'View Call'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true, // Keep notification visible until user interacts
    silent: false
  })
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(
  subscription: any,
  payload: string
): Promise<{ success: boolean; invalid: boolean; error?: string }> {
  try {
    await webpush.sendNotification(subscription, payload)
    return { success: true, invalid: false }
  } catch (error: any) {
    // Check for invalid subscription errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Invalid subscription detected:', subscription.endpoint)
      return { success: false, invalid: true, error: 'Invalid subscription' }
    }

    // Log other errors but don't mark as invalid
    console.error('Push send failed:', {
      endpoint: subscription.endpoint,
      error: error.message,
      statusCode: error.statusCode
    })

    return { 
      success: false, 
      invalid: false, 
      error: error.message || 'Unknown error' 
    }
  }
}

/**
 * Send push notification to all subscriptions for a waiter
 */
async function sendToWaiter(
  waiterId: string,
  payload: string
): Promise<{ sent: number; failed: number; invalidSubscriptions: string[]; errors: any[] }> {
  // Get all active subscriptions for the waiter
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      waiterId: waiterId
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true
    }
  })

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, invalidSubscriptions: [], errors: [] }
  }

  const invalidSubscriptions: string[] = []
  const errors: any[] = []
  let sent = 0
  let failed = 0

  // Send to each subscription
  for (const subscription of subscriptions) {
    const webPushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    }

    const result = await sendToSubscription(webPushSubscription, payload)
    
    if (result.success) {
      sent++
    } else {
      failed++
      
      if (result.invalid) {
        invalidSubscriptions.push(subscription.id)
      }
      
      errors.push({
        subscriptionId: subscription.id,
        endpoint: subscription.endpoint,
        error: result.error
      })
    }
  }

  return { sent, failed, invalidSubscriptions, errors }
}

/**
 * Clean up invalid subscriptions
 */
async function cleanupInvalidSubscriptions(subscriptionIds: string[]): Promise<void> {
  if (subscriptionIds.length === 0) return

  try {
    await prisma.pushSubscription.deleteMany({
      where: {
        id: {
          in: subscriptionIds
        }
      }
    })

    console.log(`Cleaned up ${subscriptionIds.length} invalid push subscriptions`)
  } catch (error) {
    console.error('Failed to cleanup invalid subscriptions:', error)
  }
}

/**
 * Send push notification to waiters when a call is created
 */
export async function sendCallNotification(
  callId: string,
  tableNumber: string,
  restaurantId: string,
  assignedWaiterId?: string | null
): Promise<PushResult> {
  // Check if push notifications are available
  if (!PUSH_AVAILABLE) {
    const reason = !PUSH_ENABLED ? 'disabled by feature flag' : 'VAPID keys not configured'
    console.log(`Push notifications not available (${reason}), skipping notification`)
    return {
      success: true,
      sent: 0,
      failed: 0,
      invalidSubscriptions: [],
      errors: []
    }
  }

  // Initialize web-push (should work now)
  const isInitialized = initializeWebPush()
  if (!isInitialized) {
    console.log('Failed to initialize web-push, skipping notification')
    return {
      success: true,
      sent: 0,
      failed: 0,
      invalidSubscriptions: [],
      errors: []
    }
  }

  try {

    // Create payload
    const payload: PushPayload = {
      tableNumber,
      callType: 'customer_call',
      timestamp: new Date().toISOString(),
      callId,
      restaurantId
    }

    const payloadString = createPayload(payload)

    // Determine target waiters
    let targetWaiterIds: string[] = []

    if (assignedWaiterId) {
      // Send to assigned waiter only
      targetWaiterIds = [assignedWaiterId]
    } else {
      // Send to all active waiters in the restaurant
      const waiters = await prisma.waiter.findMany({
        where: {
          restaurantId: restaurantId,
          isActive: true
        },
        select: {
          id: true
        }
      })

      targetWaiterIds = waiters.map(w => w.id)
    }

    if (targetWaiterIds.length === 0) {
      console.log('No target waiters found for push notification')
      return {
        success: true,
        sent: 0,
        failed: 0,
        invalidSubscriptions: [],
        errors: []
      }
    }

    // Send to all target waiters
    let totalSent = 0
    let totalFailed = 0
    const allInvalidSubscriptions: string[] = []
    const allErrors: any[] = []

    for (const waiterId of targetWaiterIds) {
      const result = await sendToWaiter(waiterId, payloadString)
      
      totalSent += result.sent
      totalFailed += result.failed
      allInvalidSubscriptions.push(...result.invalidSubscriptions)
      allErrors.push(...result.errors)
    }

    // Clean up invalid subscriptions
    if (allInvalidSubscriptions.length > 0) {
      await cleanupInvalidSubscriptions(allInvalidSubscriptions)
    }

    console.log('Push notification sent:', {
      callId,
      tableNumber,
      restaurantId,
      targetWaiters: targetWaiterIds.length,
      sent: totalSent,
      failed: totalFailed,
      invalid: allInvalidSubscriptions.length
    })

    return {
      success: totalFailed === 0,
      sent: totalSent,
      failed: totalFailed,
      invalidSubscriptions: allInvalidSubscriptions,
      errors: allErrors
    }

  } catch (error) {
    console.error('Push notification sending failed:', error)
    
    return {
      success: false,
      sent: 0,
      failed: 1,
      invalidSubscriptions: [],
      errors: [{
        subscriptionId: 'system',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    }
  }
}

/**
 * Test push notification (development only)
 */
export async function testPushNotification(waiterId: string): Promise<PushResult> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test push notifications not allowed in production')
  }

  return await sendCallNotification(
    'test-call-id',
    'Test Table',
    'test-restaurant-id',
    waiterId
  )
}
