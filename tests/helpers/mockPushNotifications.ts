/**
 * Mock Push Notifications Helper
 * 
 * Provides mock functionality for testing push notifications
 */

export interface MockNotification {
  callId: string
  tableNumber: string
  restaurantId: string
  waiterId?: string
  timestamp: number
  success: boolean
  error?: string
}

export interface MockPushNotificationService {
  sentNotifications: MockNotification[]
  failedNotifications: MockNotification[]
  invalidSubscriptions: Array<{
    id: string
    reason: string
  }>
  isOnline: boolean
  failureRate: number
  sendNotification: (callId: string, tableNumber: string, restaurantId: string, waiterId?: string) => Promise<{
    success: boolean
    sent: number
    failed: number
    invalidSubscriptions: Array<{ id: string; reason: string }>
  }>
  reset: () => void
  setOnlineStatus: (online: boolean) => void
  setFailureRate: (rate: number) => void
}

let mockPushService: MockPushNotificationService = {
  sentNotifications: [],
  failedNotifications: [],
  invalidSubscriptions: [],
  isOnline: true,
  failureRate: 0,
  
  sendNotification: async function(callId: string, tableNumber: string, restaurantId: string, waiterId?: string) {
    const notification: MockNotification = {
      callId,
      tableNumber,
      restaurantId,
      waiterId,
      timestamp: Date.now(),
      success: false
    }
    
    if (!this.isOnline) {
      notification.error = 'Push service offline'
      this.failedNotifications.push(notification)
      
      return {
        success: false,
        sent: 0,
        failed: 1,
        invalidSubscriptions: []
      }
    }
    
    // Simulate failure rate
    if (Math.random() < this.failureRate) {
      notification.error = 'Simulated network error'
      this.failedNotifications.push(notification)
      
      return {
        success: false,
        sent: 0,
        failed: 1,
        invalidSubscriptions: []
      }
    }
    
    // Simulate invalid subscriptions
    const invalidCount = Math.random() < 0.2 ? Math.floor(Math.random() * 3) : 0
    const invalidSubscriptions = []
    
    for (let i = 0; i < invalidCount; i++) {
      invalidSubscriptions.push({
        id: `invalid-subscription-${i}`,
        reason: 'Subscription expired'
      })
    }
    
    this.invalidSubscriptions.push(...invalidSubscriptions)
    
    // Success case
    notification.success = true
    this.sentNotifications.push(notification)
    
    return {
      success: true,
      sent: 1,
      failed: 0,
      invalidSubscriptions
    }
  },
  
  reset: function() {
    this.sentNotifications = []
    this.failedNotifications = []
    this.invalidSubscriptions = []
    this.isOnline = true
    this.failureRate = 0
  },
  
  setOnlineStatus: function(online: boolean) {
    this.isOnline = online
  },
  
  setFailureRate: function(rate: number) {
    this.failureRate = Math.max(0, Math.min(1, rate))
  }
}

/**
 * Mock push notifications for testing
 */
export function mockPushNotifications(): MockPushNotificationService {
  // Reset before setting up
  mockPushService.reset()
  
  console.log('📱 Push notifications mocked for testing')
  
  return mockPushService
}

/**
 * Clear push notification mocks
 */
export function clearPushNotificationMocks(): void {
  mockPushService.reset()
  console.log('📱 Push notification mocks cleared')
}

/**
 * Get push notification mock instance
 */
export function getPushNotificationMock(): MockPushNotificationService {
  return mockPushService
}

/**
 * Simulate push notification scenarios
 */
export class PushNotificationScenarios {
  /**
   * Simulate successful notification
   */
  static success(): void {
    mockPushService.setOnlineStatus(true)
    mockPushService.setFailureRate(0)
  }
  
  /**
   * Simulate offline service
   */
  static offline(): void {
    mockPushService.setOnlineStatus(false)
  }
  
  /**
   * Simulate network failures
   */
  static networkFailures(failureRate: number = 0.5): void {
    mockPushService.setOnlineStatus(true)
    mockPushService.setFailureRate(failureRate)
  }
  
  /**
   * Simulate invalid subscriptions
   */
  static invalidSubscriptions(): void {
    mockPushService.setOnlineStatus(true)
    mockPushService.setFailureRate(0)
    
    // The mock service already handles invalid subscriptions randomly
    // This method is for explicit scenario setup
  }
  
  /**
   * Simulate mixed scenario (some failures, some invalid subscriptions)
   */
  static mixed(): void {
    mockPushService.setOnlineStatus(true)
    mockPushService.setFailureRate(0.2) // 20% failure rate
  }
}

/**
 * Push notification test utilities
 */
export class PushNotificationTestUtils {
  /**
   * Assert notification was sent
   */
  static assertNotificationSent(callId: string, tableNumber?: string): void {
    const notification = mockPushService.sentNotifications.find(n => n.callId === callId)
    
    if (!notification) {
      throw new Error(`Expected notification for call ${callId} was not sent`)
    }
    
    if (tableNumber && notification.tableNumber !== tableNumber) {
      throw new Error(`Expected notification for table ${tableNumber}, but got ${notification.tableNumber}`)
    }
    
    if (!notification.success) {
      throw new Error(`Expected successful notification, but got error: ${notification.error}`)
    }
  }
  
  /**
   * Assert notification failed
   */
  static assertNotificationFailed(callId: string, expectedError?: string): void {
    const notification = mockPushService.failedNotifications.find(n => n.callId === callId)
    
    if (!notification) {
      throw new Error(`Expected failed notification for call ${callId} was not recorded`)
    }
    
    if (expectedError && notification.error !== expectedError) {
      throw new Error(`Expected error '${expectedError}', but got '${notification.error}'`)
    }
  }
  
  /**
   * Get notification statistics
   */
  static getStatistics(): {
    total: number
    sent: number
    failed: number
    successRate: number
    invalidSubscriptions: number
  } {
    const total = mockPushService.sentNotifications.length + mockPushService.failedNotifications.length
    const sent = mockPushService.sentNotifications.length
    const failed = mockPushService.failedNotifications.length
    const successRate = total > 0 ? sent / total : 0
    const invalidSubscriptions = mockPushService.invalidSubscriptions.length
    
    return {
      total,
      sent,
      failed,
      successRate,
      invalidSubscriptions
    }
  }
  
  /**
   * Wait for notification to be sent
   */
  static async waitForNotification(callId: string, timeoutMs: number = 1000): Promise<MockNotification> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeoutMs) {
      const notification = mockPushService.sentNotifications.find(n => n.callId === callId)
      if (notification) {
        return notification
      }
      
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    throw new Error(`No notification received for call ${callId} within ${timeoutMs}ms`)
  }
  
  /**
   * Verify notification count
   */
  static assertNotificationCount(expectedCount: number): void {
    const actualCount = mockPushService.sentNotifications.length
    
    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} notifications, but got ${actualCount}`)
    }
  }
  
  /**
   * Verify notification contains expected data
   */
  static assertNotificationContains(callId: string, expectedData: Partial<MockNotification>): void {
    const notification = mockPushService.sentNotifications.find(n => n.callId === callId)
    
    if (!notification) {
      throw new Error(`No notification found for call ${callId}`)
    }
    
    for (const [key, value] of Object.entries(expectedData)) {
      if ((notification as any)[key] !== value) {
        throw new Error(`Expected notification.${key} to be ${value}, but got ${(notification as any)[key]}`)
      }
    }
  }
}

/**
 * Export mock service for direct access in tests
 */
export { mockPushService as pushNotificationMock }
