/**
 * Performance Monitoring System
 * 
 * Comprehensive performance monitoring and logging for the WaiterCall application
 * with metrics collection, alerting, and performance optimization insights.
 */

export interface PerformanceMetrics {
  timestamp: number
  operation: string
  duration: number
  memoryUsage?: MemoryUsage
  networkLatency?: number
  errorCount?: number
  successRate?: number
  metadata?: Record<string, any>
}

export interface MemoryUsage {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export interface PerformanceAlert {
  id: string
  timestamp: number
  type: 'warning' | 'error' | 'critical'
  message: string
  metric: string
  value: number
  threshold: number
  metadata?: Record<string, any>
}

export interface PerformanceThreshold {
  metric: string
  warning: number
  error: number
  critical: number
  operation?: string
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null
  private metrics: PerformanceMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private thresholds: Map<string, PerformanceThreshold> = new Map()
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private operationTimers: Map<string, number> = new Map()
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = []

  constructor() {
    this.setupDefaultThresholds()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics()
      this.checkThresholds()
      this.cleanupOldMetrics()
    }, intervalMs)

    console.log('PerformanceMonitor: Started monitoring')
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.isMonitoring = false
    console.log('PerformanceMonitor: Stopped monitoring')
  }

  /**
   * Start timing an operation
   */
  startTimer(operation: string): string {
    const timerId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.operationTimers.set(timerId, performance.now())
    return timerId
  }

  /**
   * End timing an operation and record metrics
   */
  endTimer(timerId: string, metadata?: Record<string, any>): PerformanceMetrics | null {
    const startTime = this.operationTimers.get(timerId)
    if (!startTime) {
      console.warn(`PerformanceMonitor: Timer not found: ${timerId}`)
      return null
    }

    const duration = performance.now() - startTime
    this.operationTimers.delete(timerId)

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      operation: this.extractOperationFromTimerId(timerId),
      duration,
      memoryUsage: this.getMemoryUsage(),
      metadata
    }

    this.recordMetrics(metrics)
    return metrics
  }

  /**
   * Record performance metrics directly
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics)
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Check for immediate threshold violations
    this.checkMetricThresholds(metrics)
  }

  /**
   * Record an error for an operation
   */
  recordError(operation: string, error: Error, metadata?: Record<string, any>): void {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      operation,
      duration: 0,
      errorCount: 1,
      memoryUsage: this.getMemoryUsage(),
      metadata: {
        ...metadata,
        error: error.message,
        stack: error.stack
      }
    }

    this.recordMetrics(metrics)
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * Get performance metrics for a specific operation
   */
  getMetrics(operation: string, timeRange?: number): PerformanceMetrics[] {
    const now = Date.now()
    const cutoff = timeRange ? now - timeRange : 0

    return this.metrics
      .filter(m => m.operation === operation && m.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get all recent metrics
   */
  getAllRecentMetrics(timeRange?: number): PerformanceMetrics[] {
    const now = Date.now()
    const cutoff = timeRange ? now - timeRange : 0

    return this.metrics
      .filter(m => m.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeRange?: number): {
    totalOperations: number
    averageDuration: number
    slowestOperation: { operation: string; duration: number }
    fastestOperation: { operation: string; duration: number }
    errorRate: number
    memoryTrend: 'increasing' | 'decreasing' | 'stable'
    alerts: PerformanceAlert[]
  } {
    const metrics = this.getAllRecentMetrics(timeRange)
    const alerts = this.getRecentAlerts(timeRange)

    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: { operation: 'N/A', duration: 0 },
        fastestOperation: { operation: 'N/A', duration: 0 },
        errorRate: 0,
        memoryTrend: 'stable',
        alerts
      }
    }

    const durations = metrics.map(m => m.duration)
    const errors = metrics.filter(m => m.errorCount && m.errorCount > 0)
    
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const slowest = metrics.reduce((max, m) => m.duration > max.duration ? m : max)
    const fastest = metrics.reduce((min, m) => m.duration < min.duration ? m : min)
    const errorRate = errors.length / metrics.length

    return {
      totalOperations: metrics.length,
      averageDuration,
      slowestOperation: { operation: slowest.operation, duration: slowest.duration },
      fastestOperation: { operation: fastest.operation, duration: fastest.duration },
      errorRate,
      memoryTrend: this.calculateMemoryTrend(metrics),
      alerts
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(timeRange?: number): PerformanceAlert[] {
    const now = Date.now()
    const cutoff = timeRange ? now - timeRange : 0

    return this.alerts
      .filter(a => a.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Set custom threshold
   */
  setThreshold(metric: string, threshold: PerformanceThreshold): void {
    this.thresholds.set(metric, threshold)
  }

  /**
   * Get performance report
   */
  getPerformanceReport(timeRange?: number): {
    summary: any
    metrics: PerformanceMetrics[]
    alerts: PerformanceAlert[]
    recommendations: string[]
  } {
    const summary = this.getPerformanceSummary(timeRange)
    const metrics = this.getAllRecentMetrics(timeRange)
    const alerts = this.getRecentAlerts(timeRange)
    const recommendations = this.generateRecommendations(summary, metrics)

    return {
      summary,
      metrics,
      alerts,
      recommendations
    }
  }

  /**
   * Setup default performance thresholds
   */
  private setupDefaultThresholds(): void {
    // API response times (in milliseconds)
    this.thresholds.set('api_response_time', {
      metric: 'api_response_time',
      warning: 1000,
      error: 2000,
      critical: 5000
    })

    // Database operations (in milliseconds)
    this.thresholds.set('db_operation', {
      metric: 'db_operation',
      warning: 500,
      error: 1000,
      critical: 2000
    })

    // Realtime connection latency (in milliseconds)
    this.thresholds.set('realtime_latency', {
      metric: 'realtime_latency',
      warning: 500,
      error: 1000,
      critical: 2000
    })

    // Memory usage (in MB)
    this.thresholds.set('memory_usage', {
      metric: 'memory_usage',
      warning: 100,
      error: 200,
      critical: 400
    })

    // Error rate (percentage)
    this.thresholds.set('error_rate', {
      metric: 'error_rate',
      warning: 5,
      error: 10,
      critical: 20
    })
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memoryUsage = this.getMemoryUsage()
    
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      operation: 'system_check',
      duration: 0,
      memoryUsage,
      metadata: {
        activeTimers: this.operationTimers.size,
        totalMetrics: this.metrics.length,
        totalAlerts: this.alerts.length
      }
    }

    this.recordMetrics(metrics)
  }

  /**
   * Check all thresholds
   */
  private checkThresholds(): void {
    const summary = this.getPerformanceSummary()
    
    // Check memory usage
    if (summary.memoryTrend === 'increasing') {
      this.createAlert('warning', 'Memory usage trending upward', 'memory_trend', 0, 0)
    }

    // Check error rate
    const errorThreshold = this.thresholds.get('error_rate')
    if (errorThreshold && summary.errorRate > errorThreshold.warning) {
      this.createAlert(
        summary.errorRate > errorThreshold.critical ? 'critical' : 'warning',
        `High error rate: ${(summary.errorRate * 100).toFixed(2)}%`,
        'error_rate',
        summary.errorRate * 100,
        errorThreshold.warning
      )
    }
  }

  /**
   * Check specific metric thresholds
   */
  private checkMetricThresholds(metrics: PerformanceMetrics): void {
    const threshold = this.thresholds.get(metrics.operation)
    if (!threshold) return

    if (metrics.duration > threshold.critical) {
      this.createAlert('critical', 
        `Critical performance issue in ${metrics.operation}: ${metrics.duration.toFixed(2)}ms`,
        metrics.operation,
        metrics.duration,
        threshold.critical
      )
    } else if (metrics.duration > threshold.error) {
      this.createAlert('error',
        `Performance issue in ${metrics.operation}: ${metrics.duration.toFixed(2)}ms`,
        metrics.operation,
        metrics.duration,
        threshold.error
      )
    } else if (metrics.duration > threshold.warning) {
      this.createAlert('warning',
        `Slow performance in ${metrics.operation}: ${metrics.duration.toFixed(2)}ms`,
        metrics.operation,
        metrics.duration,
        threshold.warning
      )
    }
  }

  /**
   * Create and store an alert
   */
  private createAlert(type: 'warning' | 'error' | 'critical', message: string, metric: string, value: number, threshold: number, metadata?: Record<string, any>): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
      metric,
      value,
      threshold,
      metadata
    }

    this.alerts.push(alert)
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('PerformanceMonitor: Alert callback error:', error)
      }
    })

    // Log critical alerts
    if (type === 'critical') {
      console.error('PerformanceMonitor: CRITICAL ALERT', alert)
    }
  }

  /**
   * Calculate memory usage trend
   */
  private calculateMemoryTrend(metrics: PerformanceMetrics[]): 'increasing' | 'decreasing' | 'stable' {
    const memoryMetrics = metrics.filter(m => m.memoryUsage).slice(-10)
    
    if (memoryMetrics.length < 2) return 'stable'

    const first = memoryMetrics[0].memoryUsage!.usedJSHeapSize
    const last = memoryMetrics[memoryMetrics.length - 1].memoryUsage!.usedJSHeapSize
    const diff = last - first
    const threshold = first * 0.1 // 10% change threshold

    if (diff > threshold) return 'increasing'
    if (diff < -threshold) return 'decreasing'
    return 'stable'
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(summary: any, metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = []

    // Slow operations
    if (summary.slowestOperation.duration > 2000) {
      recommendations.push(`Optimize ${summary.slowestOperation.operation} - taking ${summary.slowestOperation.duration.toFixed(2)}ms`)
    }

    // High error rate
    if (summary.errorRate > 0.05) {
      recommendations.push(`High error rate (${(summary.errorRate * 100).toFixed(2)}%) - investigate error handling`)
    }

    // Memory issues
    if (summary.memoryTrend === 'increasing') {
      recommendations.push('Memory usage trending upward - check for memory leaks')
    }

    // Operation frequency
    const operationCounts = metrics.reduce((acc, m) => {
      acc[m.operation] = (acc[m.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const frequentOps = Object.entries(operationCounts)
      .filter(([_, count]) => count > 10)
      .map(([op, count]) => `${op} (${count} times)`)

    if (frequentOps.length > 0) {
      recommendations.push(`High frequency operations: ${frequentOps.join(', ')}`)
    }

    return recommendations
  }

  /**
   * Get memory usage information
   */
  public getMemoryUsage(): MemoryUsage | undefined {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory
    }
    return undefined
  }

  /**
   * Extract operation name from timer ID
   */
  private extractOperationFromTimerId(timerId: string): string {
    const parts = timerId.split('-')
    return parts[0] || 'unknown'
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // Keep last 24 hours
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff)
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoff)
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const report = this.getPerformanceReport()
    
    return JSON.stringify(report, null, 2)
  }

  /**
   * Reset all metrics and alerts
   */
  reset(): void {
    this.metrics = []
    this.alerts = []
    this.operationTimers.clear()
    console.log('PerformanceMonitor: Reset all metrics and alerts')
  }
}

/**
 * Performance decorator for automatic timing
 */
export function performanceMonitor(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const operationName = operation || `${target.constructor.name}.${propertyName}`

    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance()
      const timerId = monitor.startTimer(operationName)

      try {
        const result = await method.apply(this, args)
        
        const metrics = monitor.endTimer(timerId, {
          args: args.length,
          success: true
        })

        return result
      } catch (error) {
        monitor.recordError(operationName, error as Error, {
          args: args.length
        })
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Performance timing utility
 */
export class PerformanceTimer {
  private startTime: number
  private operation: string
  private monitor: PerformanceMonitor

  constructor(operation: string) {
    this.operation = operation
    this.monitor = PerformanceMonitor.getInstance()
    this.startTime = performance.now()
  }

  end(metadata?: Record<string, any>): PerformanceMetrics {
    const duration = performance.now() - this.startTime
    
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      operation: this.operation,
      duration,
      memoryUsage: this.monitor.getMemoryUsage(),
      metadata
    }

    this.monitor.recordMetrics(metrics)
    return metrics
  }

  getDuration(): number {
    return performance.now() - this.startTime
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = PerformanceMonitor.getInstance()
