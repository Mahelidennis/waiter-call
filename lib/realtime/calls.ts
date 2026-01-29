import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Real-time call subscription manager
 * Handles Supabase Realtime subscriptions for call updates
 */

export interface CallRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: any
  old?: any
  timestamp: number
}

export interface RealtimeSubscriptionConfig {
  restaurantId: string
  waiterId: string
  onCallEvent: (event: CallRealtimeEvent) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: Error) => void
}

export class CallRealtimeManager {
  private channel: RealtimeChannel | null = null
  private config: RealtimeSubscriptionConfig | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // 1 second
  private pollingFallbackTimeout: NodeJS.Timeout | null = null

  /**
   * Subscribe to real-time call updates for a specific waiter
   */
  subscribe(config: RealtimeSubscriptionConfig): void {
    this.config = config
    this.setupSubscription()
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(): void {
    this.cleanup()
  }

  /**
   * Check if realtime is connected
   */
  isRealtimeConnected(): boolean {
    return this.isConnected
  }

  private setupSubscription(): void {
    if (!this.config) {
      console.error('RealtimeManager: No config provided')
      return
    }

    try {
      // Clean up existing subscription
      this.cleanup()

      // Create channel for restaurant-specific call updates
      this.channel = supabase
        .channel(`restaurant-calls:${this.config.restaurantId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'Call',
            filter: `restaurantId=eq.${this.config.restaurantId}`
          },
          (payload: any) => this.handleRealtimeEvent(payload)
        )
        .on(
          'broadcast',
          { event: 'connection_status' },
          (payload: any) => this.handleConnectionStatus(payload)
        )
        .subscribe((status: string) => {
          this.handleSubscriptionStatus(status)
        })

      console.log('RealtimeManager: Subscribed to restaurant calls', {
        restaurantId: this.config.restaurantId,
        waiterId: this.config.waiterId
      })

    } catch (error) {
      console.error('RealtimeManager: Failed to setup subscription:', error)
      this.config.onError?.(error as Error)
      this.triggerPollingFallback()
    }
  }

  private handleRealtimeEvent(payload: any): void {
    if (!this.config) return

    try {
      const event: CallRealtimeEvent = {
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        timestamp: Date.now()
      }

      // Log event in development only
      if (process.env.NODE_ENV === 'development') {
        console.log('RealtimeManager: Call event received', {
          eventType: event.eventType,
          callId: event.new?.id || event.old?.id,
          status: event.new?.status || event.old?.status
        })
      }

      // Validate that this event is relevant to this waiter
      if (!this.isEventRelevantToWaiter(event)) {
        return
      }

      // Forward event to UI
      this.config.onCallEvent(event)

    } catch (error) {
      console.error('RealtimeManager: Error handling realtime event:', error)
      this.config.onError?.(error as Error)
    }
  }

  private handleConnectionStatus(payload: any): void {
    const connected = payload.payload?.connected || false
    
    if (this.isConnected !== connected) {
      this.isConnected = connected
      if (this.config) {
        this.config.onConnectionChange?.(connected)
      }
      
      console.log('RealtimeManager: Connection status changed', {
        connected,
        restaurantId: this.config?.restaurantId
      })

      // If disconnected, trigger polling fallback
      if (!connected) {
        this.triggerPollingFallback()
      }
    }
  }

  private handleSubscriptionStatus(status: string): void {
    const wasConnected = this.isConnected
    this.isConnected = status === 'SUBSCRIBED'
    
    if (wasConnected !== this.isConnected) {
      if (this.config) {
        this.config.onConnectionChange?.(this.isConnected)
      }
      
      console.log('RealtimeManager: Subscription status', {
        status,
        connected: this.isConnected,
        restaurantId: this.config?.restaurantId
      })

      // Handle reconnection
      if (status === 'CLOSED' && this.config) {
        this.attemptReconnection()
      }
    }

    // Reset reconnect attempts on successful connection
    if (this.isConnected) {
      this.reconnectAttempts = 0
    }
  }

  private isEventRelevantToWaiter(event: CallRealtimeEvent): boolean {
    if (!this.config) return false

    const call = event.new || event.old
    if (!call) return false

    // Event is relevant if:
    // 1. It's for this waiter's restaurant (already filtered by Supabase)
    // 2. The call is assigned to this waiter OR it's unassigned (pending)
    // 3. The call status changed (for updates)

    const isAssignedToWaiter = call.waiterId === this.config.waiterId
    const isUnassigned = !call.waiterId
    const isStatusChange = event.eventType === 'UPDATE'

    return isAssignedToWaiter || (isUnassigned && !isStatusChange) || isStatusChange
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('RealtimeManager: Max reconnection attempts reached')
      this.triggerPollingFallback()
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`RealtimeManager: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)

    setTimeout(() => {
      if (this.config) {
        this.setupSubscription()
      }
    }, delay)
  }

  private triggerPollingFallback(): void {
    // Clear existing timeout
    if (this.pollingFallbackTimeout) {
      clearTimeout(this.pollingFallbackTimeout)
    }

    // Notify UI to rely on polling
    console.log('RealtimeManager: Triggering polling fallback')
    
    // Set a timeout to periodically try reconnection
    this.pollingFallbackTimeout = setTimeout(() => {
      if (this.config && !this.isConnected) {
        console.log('RealtimeManager: Attempting to restore realtime connection')
        this.setupSubscription()
      }
    }, 30000) // Try every 30 seconds

    // Notify UI about fallback
    if (this.config) {
      this.config.onConnectionChange?.(false)
    }
  }

  private cleanup(): void {
    // Clear reconnection timeout
    if (this.pollingFallbackTimeout) {
      clearTimeout(this.pollingFallbackTimeout)
      this.pollingFallbackTimeout = null
    }

    // Remove channel
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
    }

    this.isConnected = false
    this.reconnectAttempts = 0
  }

  /**
   * Force reconnection attempt
   */
  reconnect(): void {
    console.log('RealtimeManager: Manual reconnection requested')
    this.reconnectAttempts = 0
    if (this.config) {
      this.setupSubscription()
    }
  }
}

// Singleton instance for the application
let realtimeManager: CallRealtimeManager | null = null

/**
 * Get or create the realtime manager singleton
 */
export function getRealtimeManager(): CallRealtimeManager {
  if (!realtimeManager) {
    realtimeManager = new CallRealtimeManager()
  }
  return realtimeManager
}

/**
 * Cleanup the realtime manager singleton
 */
export function cleanupRealtimeManager(): void {
  if (realtimeManager) {
    realtimeManager.unsubscribe()
    realtimeManager = null
  }
}
