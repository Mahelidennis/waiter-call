/**
 * Realtime Cleanup Utilities
 * 
 * Provides comprehensive cleanup utilities for realtime connections
 * with memory leak prevention and resource management.
 */

import { cleanupRealtimeManager, getRealtimeManager } from './calls'
import { cleanupVisibilityHandler } from './visibilityHandler'

export interface CleanupOptions {
  force?: boolean
  timeout?: number
  includeHeartbeat?: boolean
  includeTimeouts?: boolean
  includeChannels?: boolean
  includeEventListeners?: boolean
}

export interface CleanupResult {
  success: boolean
  cleanedResources: string[]
  errors: string[]
  duration: number
}

/**
 * Safe error message extraction
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * Comprehensive cleanup utility for all application resources
 */
export class RealtimeCleanup {
  private static cleanupTasks: Array<() => Promise<void> | void> = []
  private static isCleaning = false

  /**
   * Register a cleanup task
   */
  static registerCleanupTask(task: () => Promise<void> | void): void {
    this.cleanupTasks.push(task)
  }

  /**
   * Perform comprehensive cleanup
   */
  static async performCleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    if (this.isCleaning && !options.force) {
      return {
        success: false,
        cleanedResources: [],
        errors: ['Cleanup already in progress'],
        duration: 0
      }
    }

    const startTime = Date.now()
    this.isCleaning = true
    
    const cleanedResources: string[] = []
    const errors: string[] = []

    try {
      console.log('RealtimeCleanup: Starting comprehensive cleanup')

      // 1. Cleanup realtime manager
      try {
        const manager = getRealtimeManager()
        if (manager.isRealtimeConnected()) {
          cleanupRealtimeManager()
          cleanedResources.push('realtimeManager')
        }
      } catch (error) {
        errors.push(`Realtime manager cleanup failed: ${getErrorMessage(error)}`)
      }

      // 2. Cleanup visibility handler
      try {
        cleanupVisibilityHandler()
        cleanedResources.push('visibilityHandler')
      } catch (error) {
        errors.push(`Visibility handler cleanup failed: ${getErrorMessage(error)}`)
      }

      // 3. Cleanup registered tasks
      for (const task of this.cleanupTasks) {
        try {
          await Promise.resolve(task())
          cleanedResources.push('registeredTask')
        } catch (error) {
          errors.push(`Registered task cleanup failed: ${getErrorMessage(error)}`)
        }
      }

      // 4. Cleanup browser-specific resources
      if (typeof window !== 'undefined') {
        this.cleanupBrowserResources(cleanedResources, errors)
      }

      // 5. Force garbage collection if available
      if (options.force && typeof window !== 'undefined' && (window as any).gc) {
        try {
          (window as any).gc()
          cleanedResources.push('garbageCollection')
        } catch (error) {
          // Ignore GC errors
        }
      }

      console.log('RealtimeCleanup: Cleanup completed', {
        cleanedResources: cleanedResources.length,
        errors: errors.length,
        duration: Date.now() - startTime
      })

      return {
        success: errors.length === 0,
        cleanedResources,
        errors,
        duration: Date.now() - startTime
      }

    } finally {
      this.isCleaning = false
    }
  }

  /**
   * Cleanup browser-specific resources
   */
  private static cleanupBrowserResources(
    cleanedResources: string[],
    errors: string[]
  ): void {
    try {
      // Clear any remaining timeouts
      const highestTimeoutId = setTimeout(() => {}, 0)
      for (let i = 0; i < (highestTimeoutId as unknown as number); i++) {
        clearTimeout(i)
      }
      cleanedResources.push('timeouts')
    } catch (error) {
      errors.push(`Timeout cleanup failed: ${getErrorMessage(error)}`)
    }

    try {
      // Clear any remaining intervals
      const highestIntervalId = setInterval(() => {}, 0)
      for (let i = 0; i < (highestIntervalId as unknown as number); i++) {
        clearInterval(i)
      }
      cleanedResources.push('intervals')
    } catch (error) {
      errors.push(`Interval cleanup failed: ${getErrorMessage(error)}`)
    }

    try {
      // Clear any remaining animation frames
      const highestAnimationId = requestAnimationFrame(() => {})
      for (let i = 0; i < highestAnimationId; i++) {
        cancelAnimationFrame(i)
      }
      cleanedResources.push('animationFrames')
    } catch (error) {
      errors.push(`Animation frame cleanup failed: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Check if cleanup is in progress
   */
  static isCleanupInProgress(): boolean {
    return this.isCleaning
  }

  /**
   * Get cleanup statistics
   */
  static getCleanupStats(): {
    registeredTasks: number
    isCleaning: boolean
  } {
    return {
      registeredTasks: this.cleanupTasks.length,
      isCleaning: this.isCleaning
    }
  }

  /**
   * Clear all registered cleanup tasks
   */
  static clearCleanupTasks(): void {
    this.cleanupTasks = []
  }
}

/**
 * Memory leak detector for realtime connections
 */
export class MemoryLeakDetector {
  private static snapshots: Map<string, any> = new Map()
  private static checkInterval: NodeJS.Timeout | null = null

  /**
   * Start monitoring for memory leaks
   */
  static startMonitoring(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      this.checkForLeaks()
    }, intervalMs)

    console.log('MemoryLeakDetector: Started monitoring')
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    console.log('MemoryLeakDetector: Stopped monitoring')
  }

  /**
   * Take a memory snapshot
   */
  static takeSnapshot(label: string): void {
    const snapshot = {
      timestamp: Date.now(),
      label,
      memory: this.getMemoryInfo(),
      connections: this.getConnectionInfo(),
      timers: this.getTimerInfo()
    }

    this.snapshots.set(label, snapshot)
    console.log('MemoryLeakDetector: Snapshot taken', { label })
  }

  /**
   * Check for memory leaks
   */
  private static checkForLeaks(): void {
    const current = this.getCurrentState()
    
    // Compare with previous snapshots
    for (const [label, snapshot] of this.snapshots) {
      const timeDiff = current.timestamp - snapshot.timestamp
      const memoryDiff = current.memory.usedJSHeapSize - snapshot.memory.usedJSHeapSize
      
      // Check for suspicious memory growth
      if (timeDiff > 60000 && memoryDiff > 10 * 1024 * 1024) { // >10MB in 1 minute
        console.warn('MemoryLeakDetector: Potential memory leak detected', {
          label,
          timeDiff,
          memoryDiff: Math.round(memoryDiff / 1024 / 1024) + 'MB',
          currentMemory: Math.round(current.memory.usedJSHeapSize / 1024 / 1024) + 'MB'
        })
      }
    }

    // Keep only recent snapshots (last 10)
    if (this.snapshots.size > 10) {
      const entries = Array.from(this.snapshots.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      this.snapshots = new Map(entries.slice(0, 10))
    }
  }

  /**
   * Get current memory state
   */
  private static getCurrentState(): any {
    return {
      timestamp: Date.now(),
      memory: this.getMemoryInfo(),
      connections: this.getConnectionInfo(),
      timers: this.getTimerInfo()
    }
  }

  /**
   * Get memory information
   */
  private static getMemoryInfo(): any {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory
    }
    return { usedJSHeapSize: 0, totalJSHeapSize: 0 }
  }

  /**
   * Get connection information
   */
  private static getConnectionInfo(): any {
    const manager = getRealtimeManager()
    return {
      isConnected: manager.isRealtimeConnected(),
      stats: manager.getStats()
    }
  }

  /**
   * Get timer information
   */
  private static getTimerInfo(): any {
    // This is a rough estimate - actual timer counting is complex
    return {
      estimated: 'N/A'
    }
  }

  /**
   * Get memory leak report
   */
  static getMemoryLeakReport(): any {
    const current = this.getCurrentState()
    const snapshots = Array.from(this.snapshots.entries()).map(([label, snapshot]) => ({
      label,
      timestamp: snapshot.timestamp,
      memory: snapshot.memory.usedJSHeapSize,
      connections: snapshot.connections,
      diff: {
        time: current.timestamp - snapshot.timestamp,
        memory: current.memory.usedJSHeapSize - snapshot.memory.usedJSHeapSize
      }
    }))

    return {
      current,
      snapshots,
      detectedLeaks: snapshots.filter(s => s.diff.memory > 10 * 1024 * 1024 && s.diff.time > 60000)
    }
  }
}

/**
 * Automatic cleanup scheduler
 */
export class AutoCleanupScheduler {
  private static cleanupInterval: NodeJS.Timeout | null = null
  private static lastCleanup: number = 0

  /**
   * Start automatic cleanup
   */
  static startAutoCleanup(intervalMs: number = 300000): void { // 5 minutes
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(async () => {
      console.log('AutoCleanupScheduler: Performing automatic cleanup')
      
      const result = await RealtimeCleanup.performCleanup({
        force: false,
        timeout: 10000
      })

      this.lastCleanup = Date.now()

      if (!result.success) {
        console.error('AutoCleanupScheduler: Automatic cleanup failed', result.errors)
      } else {
        console.log('AutoCleanupScheduler: Automatic cleanup successful', {
          cleanedResources: result.cleanedResources.length,
          duration: result.duration
        })
      }
    }, intervalMs)

    console.log('AutoCleanupScheduler: Started automatic cleanup')
  }

  /**
   * Stop automatic cleanup
   */
  static stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    console.log('AutoCleanupScheduler: Stopped automatic cleanup')
  }

  /**
   * Get scheduler status
   */
  static getStatus(): {
    isRunning: boolean
    lastCleanup: Date | null
    nextCleanup: Date | null
  } {
    return {
      isRunning: this.cleanupInterval !== null,
      lastCleanup: this.lastCleanup,
      nextCleanup: this.cleanupInterval ? new Date(Date.now() + 300000) : null
    }
  }
}

/**
 * Global cleanup function for emergency situations
 */
export async function emergencyCleanup(): Promise<void> {
  console.warn('Emergency cleanup triggered')
  
  try {
    // Force cleanup with no timeouts
    await RealtimeCleanup.performCleanup({
      force: true,
      timeout: 0
    })
    
    // Stop all monitoring
    MemoryLeakDetector.stopMonitoring()
    AutoCleanupScheduler.stopAutoCleanup()
    
    console.log('Emergency cleanup completed')
  } catch (error) {
    console.error('Emergency cleanup failed:', error)
  }
}

/**
 * Initialize all cleanup utilities
 */
export function initCleanupUtilities(): void {
  // Start memory leak monitoring in development
  if (process.env.NODE_ENV === 'development') {
    MemoryLeakDetector.startMonitoring(30000)
    MemoryLeakDetector.takeSnapshot('initial')
  }

  // Start automatic cleanup
  AutoCleanupScheduler.startAutoCleanup(300000) // 5 minutes

  // Register emergency cleanup for page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', emergencyCleanup)
  }

  console.log('Cleanup utilities initialized')
}
