// Service Worker for Waiter Call PWA
// Stage 4.4: Push Notification Click Handling

const CACHE_NAME = 'waiter-call-v1'
const STATIC_ASSETS = [
  '/',
  '/waiter/login',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Installation complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activation complete')
        return self.clients.claim()
      })
      .catch((error) => {
        console.error('Service Worker: Activation failed:', error)
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip API requests - let them fail naturally
  if (event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url)
          return response
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response since it can only be consumed once
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('Service Worker: Caching new resource:', event.request.url)
                cache.put(event.request, responseToCache)
              })
              .catch((error) => {
                console.error('Service Worker: Failed to cache resource:', error)
              })

            return response
          })
          .catch((error) => {
            console.log('Service Worker: Network failed, serving offline page for:', event.request.url)
            
            // Return cached root page for navigation failures
            if (event.request.destination === 'document') {
              return caches.match('/')
            }
            
            // Otherwise, let the error propagate
            throw error
          })
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 SERVICE WORKER: Push event received')
  
  if (!event.data) {
    console.log('🔔 SERVICE WORKER: Push event received with no data')
    return
  }

  try {
    const data = event.data.json()
    console.log('🔔 SERVICE WORKER: Push notification data received:', data)

    const options = {
      body: data.body || 'New call received',
      icon: data.icon || '/icons/icon-192x192.svg',
      badge: data.badge || '/icons/icon-72x72.svg',
      tag: data.tag || 'call-notification',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    }

    console.log('🔔 SERVICE WORKER: Showing notification with options:', options)

    event.waitUntil(
      self.registration.showNotification(data.title || 'Waiter Call', options)
        .then(() => {
          console.log('🔔 SERVICE WORKER: Notification shown successfully')
        })
        .catch((error) => {
          console.error('🔔 SERVICE WORKER: Failed to show notification:', error)
        })
    )
  } catch (error) {
    console.error('🔔 SERVICE WORKER: Error processing push data:', error)
    
    // Fallback notification
    console.log('🔔 SERVICE WORKER: Using fallback notification')
    event.waitUntil(
      self.registration.showNotification('Waiter Call', {
        body: 'New call received',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg'
      })
        .then(() => {
          console.log('🔔 SERVICE WORKER: Fallback notification shown successfully')
        })
        .catch((fallbackError) => {
          console.error('🔔 SERVICE WORKER: Failed to show fallback notification:', fallbackError)
        })
    )
  }
})

// Notification click event - handle user interaction with notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.notification.data)
  
  // Close the notification immediately
  event.notification.close()

  // Extract data from notification
  const notificationData = event.notification.data || {}
  const callId = notificationData.callId
  const targetUrl = notificationData.url || '/waiter/dashboard'

  // Build URL with callId parameter if available
  const urlWithParams = callId ? `${targetUrl}?callId=${callId}` : targetUrl

  // Handle navigation based on platform and app state
  event.waitUntil(
    handleNotificationClick(urlWithParams, callId)
  )
})

/**
 * Handle notification click navigation
 * @param {string} url - Target URL to navigate to
 * @param {string} callId - Optional call ID for additional handling
 */
async function handleNotificationClick(url, callId) {
  try {
    // Get all open clients
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    // Find existing waiter dashboard client
    const waiterClient = clients.find(client => 
      client.url.includes('/waiter/') && 
      client.visibilityState === 'visible'
    )

    if (waiterClient) {
      // Focus existing client and navigate
      console.log('Service Worker: Focusing existing waiter client')
      await waiterClient.focus()
      await waiterClient.navigate(url)
    } else {
      // Open new client
      console.log('Service Worker: Opening new client for URL:', url)
      await self.clients.openWindow(url)
    }

    // Optional: Log the click for analytics (non-blocking)
    if (callId) {
      console.log('Service Worker: Push notification clicked for call:', callId)
      // Could send analytics here in future stages
    }

  } catch (error) {
    console.error('Service Worker: Error handling notification click:', error)
    
    // Fallback: try to open new window
    try {
      await self.clients.openWindow(url)
    } catch (fallbackError) {
      console.error('Service Worker: Fallback navigation failed:', fallbackError)
    }
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skip waiting requested')
    self.skipWaiting()
  }
})

// Lifecycle logging
self.addEventListener('controllerchange', () => {
  console.log('Service Worker: Controller changed')
})

console.log('Service Worker: Loaded successfully')
