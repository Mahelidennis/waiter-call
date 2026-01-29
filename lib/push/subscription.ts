/**
 * Push Subscription Management
 * 
 * Handles browser push subscription registration and management.
 * This is frontend-only logic - no actual push sending here.
 */

// Feature flag for push notifications
export const PUSH_ENABLED = process.env.NEXT_PUBLIC_PUSH_ENABLED === 'true'

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushStatus {
  supported: boolean
  permission: NotificationPermission
  subscribed: boolean
  subscription?: PushSubscription
  iosLimited: boolean
}

export interface PushSubscriptionResponse {
  success: boolean
  subscriptionId?: string
  message: string
}

/**
 * Check if push notifications are supported in current browser
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Check if running on iOS Safari (has limitations)
 */
export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  
  const ua = navigator.userAgent.toLowerCase()
  return (
    /iphone|ipad|ipod/.test(ua) &&
    /safari/.test(ua) &&
    !/chrome|crios|fxios|opera/.test(ua)
  )
}

/**
 * Get current push notification status
 */
export async function getPushStatus(): Promise<PushStatus> {
  const supported = isPushSupported()
  const iosLimited = isIOSSafari()
  
  if (!supported) {
    return {
      supported: false,
      permission: 'default',
      subscribed: false,
      iosLimited
    }
  }

  const permission = Notification.permission
  
  // Get existing subscription
  let subscription: PushSubscription | null = null
  let subscribed = false
  
  try {
    const registration = await navigator.serviceWorker.ready
    subscription = await registration.pushManager.getSubscription()
    subscribed = !!subscription
  } catch (error) {
    console.warn('Failed to get push subscription:', error)
  }

  return {
    supported: true,
    permission,
    subscribed,
    subscription: subscription || undefined,
    iosLimited
  }
}

/**
 * Request notification permission
 * Must be called in response to user gesture
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser')
  }

  // Request permission
  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported')
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready
    
    console.log('Service worker registered for push notifications')
    return registration
  } catch (error) {
    console.error('Service worker registration failed:', error)
    throw new Error('Failed to register service worker')
  }
}

/**
 * Create push subscription with the browser
 */
export async function createPushSubscription(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported')
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Create subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required for Chrome
      applicationServerKey: await getVAPIDPublicKey() as any
    }) as PushSubscription & { keys: { p256dh: string; auth: string } }

    console.log('Push subscription created:', subscription.endpoint)
    return subscription
  } catch (error) {
    console.error('Push subscription creation failed:', error)
    throw new Error('Failed to create push subscription')
  }
}

/**
 * Get VAPID public key from environment
 */
async function getVAPIDPublicKey(): Promise<Uint8Array> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  
  if (!vapidPublicKey) {
    throw new Error('VAPID public key not configured')
  }

  // Convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  return urlBase64ToUint8Array(vapidPublicKey)
}

/**
 * Extract subscription data for API
 */
export function extractSubscriptionData(subscription: PushSubscription): PushSubscriptionData {
  if (!(subscription as any).keys) {
    throw new Error('Subscription keys not available')
  }

  const keys = (subscription as any).keys
  return {
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth
  }
}

/**
 * Send subscription data to backend
 */
export async function registerSubscriptionWithBackend(
  subscriptionData: PushSubscriptionData
): Promise<PushSubscriptionResponse> {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...subscriptionData,
      userAgent: navigator.userAgent
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to register subscription')
  }

  return response.json()
}

/**
 * Complete flow: Request permission and register subscription
 */
export async function enablePushNotifications(): Promise<PushSubscriptionResponse> {
  // Feature flag check
  if (!PUSH_ENABLED) {
    throw new Error('Push notifications are not enabled')
  }

  // Check support
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser')
  }

  // Request permission
  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    throw new Error(`Notification permission ${permission}`)
  }

  // Register service worker
  await registerServiceWorker()

  // Create subscription
  const subscription = await createPushSubscription()

  // Extract data
  const subscriptionData = extractSubscriptionData(subscription)

  // Send to backend
  return await registerSubscriptionWithBackend(subscriptionData)
}

/**
 * Remove push subscription
 */
export async function disablePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      // Unsubscribe from push service
      await subscription.unsubscribe()
      
      // Remove from backend
      const subscriptionData = extractSubscriptionData(subscription)
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscriptionData.endpoint
        })
      })
      
      console.log('Push subscription removed')
    }
  } catch (error) {
    console.error('Failed to disable push notifications:', error)
    throw new Error('Failed to disable push notifications')
  }
}
