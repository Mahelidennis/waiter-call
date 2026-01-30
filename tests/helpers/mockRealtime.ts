/**
 * Mock Realtime Connection Helper
 * 
 * Provides mock functionality for testing Supabase Realtime connections
 */

export interface MockRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: any
  old?: any
  timestamp: number
  table: string
  schema: string
}

export interface MockRealtimeConnection {
  isConnected: boolean
  events: MockRealtimeEvent[]
  subscriptions: Array<{
    table: string
    filter: string
    callback: (event: MockRealtimeEvent) => void
  }>
  connect: () => Promise<void>
  disconnect: () => void
  subscribe: (table: string, filter: string, callback: (event: MockRealtimeEvent) => void) => void
  unsubscribe: (table: string) => void
  simulateEvent: (event: MockRealtimeEvent) => void
  reset: () => void
  setConnectionStatus: (connected: boolean) => void
}

let mockRealtimeService: MockRealtimeConnection = {
  isConnected: false,
  events: [],
  subscriptions: [],
  
  connect: async function() {
    this.isConnected = true
    console.log('🔗 Mock realtime connection established')
  },
  
  disconnect: function() {
    this.isConnected = false
    this.subscriptions = []
    console.log('🔌 Mock realtime connection closed')
  },
  
  subscribe: function(table: string, filter: string, callback: (event: MockRealtimeEvent) => void) {
    this.subscriptions.push({ table, filter, callback })
    console.log(`📡 Subscribed to ${table} with filter: ${filter}`)
  },
  
  unsubscribe: function(table: string) {
    this.subscriptions = this.subscriptions.filter(sub => sub.table !== table)
    console.log(`📡 Unsubscribed from ${table}`)
  },
  
  simulateEvent: function(event: MockRealtimeEvent) {
    this.events.push(event)
    
    // Notify relevant subscribers
    this.subscriptions.forEach(sub => {
      if (sub.table === event.table) {
        sub.callback(event)
      }
    })
    
    console.log(`📢 Simulated realtime event: ${event.eventType} on ${event.table}`)
  },
  
  reset: function() {
    this.isConnected = false
    this.events = []
    this.subscriptions = []
    console.log('🔄 Mock realtime connection reset')
  },
  
  setConnectionStatus: function(connected: boolean) {
    this.isConnected = connected
    console.log(`🔗 Realtime connection status: ${connected ? 'connected' : 'disconnected'}`)
  }
}

/**
 * Mock realtime connection for testing
 */
export function mockRealtimeConnection(): MockRealtimeConnection {
  mockRealtimeService.reset()
  console.log('🔗 Realtime connection mocked for testing')
  return mockRealtimeService
}

/**
 * Clear realtime connection mocks
 */
export function clearRealtimeMocks(): void {
  mockRealtimeService.reset()
  console.log('🔗 Realtime connection mocks cleared')
}

/**
 * Get realtime connection mock instance
 */
export function getRealtimeMock(): MockRealtimeConnection {
  return mockRealtimeService
}

/**
 * Realtime connection test scenarios
 */
export class RealtimeConnectionScenarios {
  /**
   * Simulate successful connection
   */
  static connected(): void {
    mockRealtimeService.setConnectionStatus(true)
  }
  
  /**
   * Simulate disconnected connection
   */
  static disconnected(): void {
    mockRealtimeService.setConnectionStatus(false)
  }
  
  /**
   * Simulate connection instability
   */
  static unstable(): void {
    let connected = true
    const interval = setInterval(() => {
      connected = !connected
      mockRealtimeService.setConnectionStatus(connected)
    }, 1000)
    
    // Stop after 10 seconds
    setTimeout(() => {
      clearInterval(interval)
      mockRealtimeService.setConnectionStatus(true)
    }, 10000)
  }
}

/**
 * Realtime event test utilities
 */
export class RealtimeEventTestUtils {
  /**
   * Assert event was received
   */
  static assertEventReceived(
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    timeoutMs: number = 1000
  ): Promise<MockRealtimeEvent> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const checkEvent = () => {
        const event = mockRealtimeService.events.find(
          e => e.eventType === eventType && e.table === table
        )
        
        if (event) {
          resolve(event)
        } else if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`No ${eventType} event received for ${table} within ${timeoutMs}ms`))
        } else {
          setTimeout(checkEvent, 10)
        }
      }
      
      checkEvent()
    })
  }
  
  /**
   * Assert event count
   */
  static assertEventCount(expectedCount: number, eventType?: string, table?: string): void {
    let events = mockRealtimeService.events
    
    if (eventType) {
      events = events.filter(e => e.eventType === eventType)
    }
    
    if (table) {
      events = events.filter(e => e.table === table)
    }
    
    if (events.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} events, but got ${events.length}`)
    }
  }
  
  /**
   * Assert event contains expected data
   */
  static assertEventContains(
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    expectedData: Partial<MockRealtimeEvent>
  ): void {
    const event = mockRealtimeService.events.find(
      e => e.eventType === eventType && e.table === table
    )
    
    if (!event) {
      throw new Error(`No ${eventType} event found for ${table}`)
    }
    
    for (const [key, value] of Object.entries(expectedData)) {
      if ((event as any)[key] !== value) {
        throw new Error(`Expected event.${key} to be ${value}, but got ${(event as any)[key]}`)
      }
    }
  }
  
  /**
   * Get event statistics
   */
  static getEventStatistics(): {
    const events = mockRealtimeService.events
    const insertCount = events.filter(e => e.eventType === 'INSERT').length
    const updateCount = events.filter(e => e.eventType === 'UPDATE').length
    const deleteCount = events.filter(e => e.eventType === 'DELETE').length
    
    return {
      total: events.length,
      insert: insertCount,
      update: updateCount,
      delete: deleteCount,
      byTable: events.reduce((acc, event) => {
        acc[event.table] = (acc[event.table] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
  
  /**
   * Wait for specific number of events
   */
  static async waitForEventCount(
    count: number,
    timeoutMs: number = 2000
  ): Promise<MockRealtimeEvent[]> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const checkCount = () => {
        if (mockRealtimeService.events.length >= count) {
          resolve(mockRealtimeService.events.slice(-count))
        } else if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Only ${mockRealtimeService.events.length} events received within ${timeoutMs}ms (expected ${count})`))
        } else {
          setTimeout(checkCount, 10)
        }
      }
      
      checkCount()
    })
  }
  
  /**
   * Clear events
   */
  static clearEvents(): void {
    mockRealtimeService.events = []
    console.log('📢 Realtime events cleared')
  }
}

/**
 * Mock Supabase Realtime Channel
 */
export class MockRealtimeChannel {
  private channelName: string
  private callbacks: Map<string, (payload: any) => void> = new Map()
  
  constructor(channelName: string) {
    this.channelName = channelName
  }
  
  on(event: string, filter: any, callback: (payload: any) => void): MockRealtimeChannel {
    const key = `${event}-${JSON.stringify(filter)}`
    this.callbacks.set(key, callback)
    return this
  }
  
  subscribe(callback: (status: string) => void): MockRealtimeChannel {
    // Simulate subscription
    setTimeout(() => callback('SUBSCRIBED'), 100)
    return this
  }
  
  send(payload: any): void {
    // Simulate sending message
    console.log(`📤 Sending message on ${this.channelName}:`, payload)
  }
  
  simulateMessage(event: string, payload: any): void {
    // Find matching callback
    for (const [key, callback] of this.callbacks.entries()) {
      if (key.startsWith(event)) {
        callback(payload)
        break
      }
    }
  }
}

/**
 * Mock Supabase Client
 */
export class MockSupabaseClient {
  private channels: Map<string, MockRealtimeChannel> = new Map()
  
  channel(channelName: string): MockRealtimeChannel {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new MockRealtimeChannel(channelName))
    }
    return this.channels.get(channelName)!
  }
  
  removeChannel(channel: MockRealtimeChannel): void {
    const channelName = channel.channelName
    if (this.channels.has(channelName)) {
      this.channels.delete(channelName)
      console.log(`🔌 Removed channel: ${channelName}`)
    }
  }
  
  getChannel(channelName: string): MockRealtimeChannel | undefined {
    return this.channels.get(channelName)
  }
  
  reset(): void {
    this.channels.clear()
    console.log('🔄 Mock Supabase client reset')
  }
}

/**
 * Export mock instances
 */
export const mockSupabaseClient = new MockSupabaseClient()
export const realtimeMock = mockRealtimeService
