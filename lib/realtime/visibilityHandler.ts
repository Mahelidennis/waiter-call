/**
 * Browser Visibility Handler for Realtime Connections
 * 
 * Automatically manages realtime connections based on page visibility
 * to prevent memory leaks and unnecessary resource usage.
 */

import { cleanupRealtimeManager, getRealtimeManager } from './calls'

export interface VisibilityConfig {
  cleanupOnHidden?: boolean
  reconnectOnVisible?: boolean
  visibilityCheckInterval?: number
  maxHiddenTime?: number
}

export class VisibilityHandler {
  private isHidden: boolean = false
  private hiddenStartTime: number | null = null
  private visibilityCheckInterval: NodeJS.Timeout | null = null
  private config: VisibilityConfig
  private manager: any = null

  constructor(config: VisibilityConfig = {}) {
    this.config = {
      cleanupOnHidden: true,
      reconnectOnVisible: true,
      visibilityCheckInterval: 1000, // Check every second
      maxHiddenTime: 5 * 60 * 1000, // 5 minutes
      ...config
    }

    if (typeof window !== 'undefined') {
      this.setupVisibilityListeners()
      this.startVisibilityMonitoring()
    }
  }

  private setupVisibilityListeners(): void {
    // Page Visibility API
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }

    // Page unload events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this))
      window.addEventListener('unload', this.handlePageUnload.bind(this))
      window.addEventListener('pagehide', this.handlePageUnload.bind(this))
    }

    // Focus/blur events
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleFocus.bind(this))
      window.addEventListener('blur', this.handleBlur.bind(this))
    }
  }

  private handleVisibilityChange(): void {
    if (typeof document === 'undefined') return

    const wasHidden = this.isHidden
    this.isHidden = document.hidden

    console.log(`VisibilityHandler: Visibility changed`, {
      wasHidden,
      isHidden: this.isHidden,
      timestamp: Date.now()
    })

    if (wasHidden !== this.isHidden) {
      if (this.isHidden) {
        this.handlePageHidden()
      } else {
        this.handlePageVisible()
      }
    }
  }

  private handlePageHidden(): void {
    this.hiddenStartTime = Date.now()
    
    console.log('VisibilityHandler: Page hidden')

    // Cleanup connections if configured
    if (this.config.cleanupOnHidden) {
      this.manager = getRealtimeManager()
      if (this.manager.isRealtimeConnected()) {
        console.log('VisibilityHandler: Cleaning up realtime connection due to page hidden')
        cleanupRealtimeManager()
      }
    }
  }

  private handlePageVisible(): void {
    const hiddenDuration = this.hiddenStartTime ? Date.now() - this.hiddenStartTime : 0
    
    console.log('VisibilityHandler: Page visible', {
      hiddenDuration: hiddenDuration,
      maxHiddenTime: this.config.maxHiddenTime
    })

    this.hiddenStartTime = null

    // Reconnect if configured and hidden duration is within limits
    if (this.config.reconnectOnVisible && 
        (!this.config.maxHiddenTime || hiddenDuration < this.config.maxHiddenTime)) {
      
      console.log('VisibilityHandler: Reconnecting realtime connection due to page visible')
      // The next subscription attempt will automatically create a new manager
    }
  }

  private handleFocus(): void {
    if (!this.isHidden) {
      console.log('VisibilityHandler: Page focused')
      this.handlePageVisible()
    }
  }

  private handleBlur(): void {
    console.log('VisibilityHandler: Page blurred')
    this.handlePageHidden()
  }

  private handlePageUnload(): void {
    console.log('VisibilityHandler: Page unloading - performing cleanup')
    this.cleanup()
  }

  private startVisibilityMonitoring(): void {
    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval)
    }

    this.visibilityCheckInterval = setInterval(() => {
      this.checkVisibilityStatus()
    }, this.config.visibilityCheckInterval)
  }

  private checkVisibilityStatus(): void {
    if (typeof document === 'undefined') return

    const currentlyHidden = document.hidden
    
    // Sync internal state if it differs from actual state
    if (currentlyHidden !== this.isHidden) {
      console.warn('VisibilityHandler: State mismatch detected', {
        internal: this.isHidden,
        actual: currentlyHidden
      })
      this.handleVisibilityChange()
    }

    // Check if page has been hidden too long
    if (this.isHidden && this.hiddenStartTime && this.config.maxHiddenTime) {
      const hiddenDuration = Date.now() - this.hiddenStartTime
      
      if (hiddenDuration > this.config.maxHiddenTime) {
        console.log('VisibilityHandler: Page hidden too long, forcing cleanup')
        this.forceCleanup()
      }
    }
  }

  private forceCleanup(): void {
    console.log('VisibilityHandler: Force cleanup triggered')
    cleanupRealtimeManager()
    this.hiddenStartTime = null
  }

  /**
   * Get current visibility status
   */
  getVisibilityStatus(): {
    isHidden: boolean
    hiddenStartTime: number | null
    hiddenDuration: number | null
  } {
    const hiddenDuration = this.hiddenStartTime ? Date.now() - this.hiddenStartTime : null
    
    return {
      isHidden: this.isHidden,
      hiddenStartTime: this.hiddenStartTime,
      hiddenDuration
    }
  }

  /**
   * Manual cleanup
   */
  cleanup(): void {
    console.log('VisibilityHandler: Manual cleanup')
    
    // Clear monitoring interval
    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval)
      this.visibilityCheckInterval = null
    }

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handlePageUnload.bind(this))
      window.removeEventListener('unload', this.handlePageUnload.bind(this))
      window.removeEventListener('pagehide', this.handlePageUnload.bind(this))
      window.removeEventListener('focus', this.handleFocus.bind(this))
      window.removeEventListener('blur', this.handleBlur.bind(this))
    }

    // Cleanup realtime connections
    cleanupRealtimeManager()
    
    // Reset state
    this.isHidden = false
    this.hiddenStartTime = null
    this.manager = null
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VisibilityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart monitoring if interval changed
    if (newConfig.visibilityCheckInterval) {
      this.startVisibilityMonitoring()
    }
  }
}

// Global visibility handler instance
let visibilityHandler: VisibilityHandler | null = null

/**
 * Initialize the visibility handler
 */
export function initVisibilityHandler(config?: VisibilityConfig): VisibilityHandler {
  if (!visibilityHandler) {
    visibilityHandler = new VisibilityHandler(config)
  }
  return visibilityHandler
}

/**
 * Get the visibility handler instance
 */
export function getVisibilityHandler(): VisibilityHandler | null {
  return visibilityHandler
}

/**
 * Cleanup the visibility handler
 */
export function cleanupVisibilityHandler(): void {
  if (visibilityHandler) {
    visibilityHandler.cleanup()
    visibilityHandler = null
  }
}
