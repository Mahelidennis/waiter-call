/**
 * API Performance Monitoring Middleware
 * 
 * Monitors API endpoints for performance issues, tracks response times,
 * error rates, and provides detailed logging for debugging.
 */

import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor, PerformanceTimer } from './performanceMonitor'

export interface ApiMetrics {
  method: string
  url: string
  statusCode: number
  duration: number
  requestSize: number
  responseSize: number
  userAgent?: string
  ip?: string
  timestamp: number
  error?: string
}

export interface ApiMonitoringOptions {
  slowRequestThreshold?: number
  errorRateThreshold?: number
  enableDetailedLogging?: boolean
  logRequestBody?: boolean
  logResponseBody?: boolean
}

export class ApiMonitor {
  private static instance: ApiMonitor
  private metrics: ApiMetrics[] = []
  private options: ApiMonitoringOptions

  constructor(options: ApiMonitoringOptions = {}) {
    this.options = {
      slowRequestThreshold: 1000, // 1 second
      errorRateThreshold: 0.05, // 5%
      enableDetailedLogging: process.env.NODE_ENV === 'development',
      logRequestBody: false,
      logResponseBody: false,
      ...options
    }
  }

  static getInstance(options?: ApiMonitoringOptions): ApiMonitor {
    if (!ApiMonitor.instance) {
      ApiMonitor.instance = new ApiMonitor(options)
    }
    return ApiMonitor.instance
  }

  /**
   * Middleware function for API monitoring
   */
  middleware() {
    return async (request: NextRequest, response: NextResponse) => {
      const startTime = performance.now()
      const timer = new PerformanceTimer('api_request')
      
      // Clone the response to intercept it
      const originalResponse = response.clone()
      
      try {
        // Get request details
        const requestDetails = this.getRequestDetails(request)
        
        // Wait for the response
        const responseClone = new Response(originalResponse.body, {
          status: originalResponse.status,
          statusText: originalResponse.statusText,
          headers: originalResponse.headers,
        })
        
        const responseText = await responseClone.text()
        const endTime = performance.now()
        const duration = endTime - startTime
        
        // Create metrics
        const metrics: ApiMetrics = {
          ...requestDetails,
          statusCode: originalResponse.status,
          duration,
          responseSize: responseText.length,
          timestamp: Date.now()
        }

        // Check for slow requests
        if (duration > this.options.slowRequestThreshold!) {
          this.logSlowRequest(metrics, request, responseText)
        }

        // Check for errors
        if (originalResponse.status >= 400) {
          metrics.error = this.getErrorMessage(originalResponse.status, responseText)
          this.logError(metrics, request, responseText)
        }

        // Record metrics
        this.recordMetrics(metrics)
        
        // End performance timer
        timer.end({
          statusCode: originalResponse.status,
          responseSize: responseText.length
        })

        // Return original response
        return response

      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        const metrics: ApiMetrics = {
          ...this.getRequestDetails(request),
          statusCode: 500,
          duration,
          responseSize: 0,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }

        this.recordMetrics(metrics)
        this.logError(metrics, request, '')
        
        timer.end({
          statusCode: 500,
          responseSize: 0,
          error: metrics.error
        })

        throw error
      }
    }
  }

  /**
   * Get request details for monitoring
   */
  private getRequestDetails(request: NextRequest): Omit<ApiMetrics, 'statusCode' | 'duration' | 'responseSize' | 'timestamp' | 'error'> {
    return {
      method: request.method,
      url: request.url,
      requestSize: this.getRequestSize(request),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: this.getClientIP(request)
    }
  }

  /**
   * Estimate request size
   */
  private getRequestSize(request: NextRequest): number {
    try {
      const contentLength = request.headers.get('content-length')
      if (contentLength) {
        return parseInt(contentLength, 10)
      }
      
      // Rough estimate for JSON requests
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return 1024 // Default estimate
      }
      
      return 0
    } catch {
      return 0
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown'
    )
  }

  /**
   * Get error message from response
   */
  private getErrorMessage(statusCode: number, responseBody: string): string {
    try {
      const body = JSON.parse(responseBody)
      return body.error || body.message || `HTTP ${statusCode}`
    } catch {
      return `HTTP ${statusCode}`
    }
  }

  /**
   * Log slow requests
   */
  private logSlowRequest(metrics: ApiMetrics, request: NextRequest, responseBody: string): void {
    console.warn('🐌 Slow API Request Detected', {
      method: metrics.method,
      url: metrics.url,
      duration: `${metrics.duration.toFixed(2)}ms`,
      statusCode: metrics.statusCode,
      userAgent: metrics.userAgent,
      ip: metrics.ip,
      requestSize: `${metrics.requestSize} bytes`,
      responseSize: `${metrics.responseSize} bytes`,
      timestamp: new Date(metrics.timestamp).toISOString()
    })

    if (this.options.enableDetailedLogging) {
      console.log('Request Details:', {
        headers: Object.fromEntries(request.headers.entries()),
        query: Object.fromEntries(request.nextUrl.searchParams.entries())
      })
    }

    if (this.options.logResponseBody && responseBody) {
      try {
        const parsedBody = JSON.parse(responseBody)
        console.log('Response Body:', parsedBody)
      } catch {
        console.log('Response Body (raw):', responseBody.substring(0, 500))
      }
    }
  }

  /**
   * Log errors
   */
  private logError(metrics: ApiMetrics, request: NextRequest, responseBody: string): void {
    console.error('❌ API Error Detected', {
      method: metrics.method,
      url: metrics.url,
      statusCode: metrics.statusCode,
      duration: `${metrics.duration.toFixed(2)}ms`,
      error: metrics.error,
      userAgent: metrics.userAgent,
      ip: metrics.ip,
      requestSize: `${metrics.requestSize} bytes`,
      responseSize: `${metrics.responseSize} bytes`,
      timestamp: new Date(metrics.timestamp).toISOString()
    })

    if (this.options.enableDetailedLogging) {
      console.error('Error Context:', {
        headers: Object.fromEntries(request.headers.entries()),
        query: Object.fromEntries(request.nextUrl.searchParams.entries()),
        responseBody: responseBody.substring(0, 1000)
      })
    }
  }

  /**
   * Record metrics
   */
  private recordMetrics(metrics: ApiMetrics): void {
    this.metrics.push(metrics)
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Check error rate
    this.checkErrorRate()
  }

  /**
   * Check error rate and alert if needed
   */
  private checkErrorRate(): void {
    const recentMetrics = this.metrics.slice(-100) // Last 100 requests
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = errorCount / recentMetrics.length

    if (errorRate > this.options.errorRateThreshold!) {
      console.warn('🚨 High API Error Rate Detected', {
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
        errorCount,
        totalRequests: recentMetrics.length,
        timeWindow: 'Last 100 requests'
      })

      // Create performance alert
      performanceMonitor.recordError('api_error_rate', new Error(`High error rate: ${(errorRate * 100).toFixed(2)}%`), {
        errorCount,
        totalRequests: recentMetrics.length,
        errorRate
      })
    }
  }

  /**
   * Get API performance summary
   */
  getPerformanceSummary(timeRange?: number): {
    totalRequests: number
    averageResponseTime: number
    slowestRequest: { url: string; duration: number; statusCode: number }
    fastestRequest: { url: string; duration: number; statusCode: number }
    errorRate: number
    statusCodeDistribution: Record<number, number>
    slowRequestsCount: number
    averageRequestSize: number
    averageResponseSize: number
  } {
    const now = Date.now()
    const cutoff = timeRange ? now - timeRange : 0
    
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoff)
    
    if (relevantMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestRequest: { url: 'N/A', duration: 0, statusCode: 0 },
        fastestRequest: { url: 'N/A', duration: 0, statusCode: 0 },
        errorRate: 0,
        statusCodeDistribution: {},
        slowRequestsCount: 0,
        averageRequestSize: 0,
        averageResponseSize: 0
      }
    }

    const durations = relevantMetrics.map(m => m.duration)
    const errors = relevantMetrics.filter(m => m.statusCode >= 400)
    const slowRequests = relevantMetrics.filter(m => m.duration > this.options.slowRequestThreshold!)
    
    const statusCodeDistribution = relevantMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return {
      totalRequests: relevantMetrics.length,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      slowestRequest: relevantMetrics.reduce((max, m) => m.duration > max.duration ? m : max),
      fastestRequest: relevantMetrics.reduce((min, m) => m.duration < min.duration ? m : min),
      errorRate: errors.length / relevantMetrics.length,
      statusCodeDistribution,
      slowRequestsCount: slowRequests.length,
      averageRequestSize: relevantMetrics.reduce((sum, m) => sum + m.requestSize, 0) / relevantMetrics.length,
      averageResponseSize: relevantMetrics.reduce((sum, m) => sum + m.responseSize, 0) / relevantMetrics.length
    }
  }

  /**
   * Get detailed metrics
   */
  getDetailedMetrics(timeRange?: number): ApiMetrics[] {
    const now = Date.now()
    const cutoff = timeRange ? now - timeRange : 0
    
    return this.metrics
      .filter(m => m.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get endpoint-specific metrics
   */
  getEndpointMetrics(endpoint: string, timeRange?: number): {
    const now = Date.now()
    const cutoff = timeRange ? now - timeRange : 0
    
    const endpointMetrics = this.metrics
      .filter(m => m.url.includes(endpoint) && m.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)

    if (endpointMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequestsCount: 0
      }
    }

    const durations = endpointMetrics.map(m => m.duration)
    const errors = endpointMetrics.filter(m => m.statusCode >= 400)
    const slowRequests = endpointMetrics.filter(m => m.duration > this.options.slowRequestThreshold!)

    return {
      totalRequests: endpointMetrics.length,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      errorRate: errors.length / endpointMetrics.length,
      slowRequestsCount: slowRequests.length
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const summary = this.getPerformanceSummary()
    const detailed = this.getDetailedMetrics()
    
    return JSON.stringify({
      summary,
      detailed: detailed.slice(0, 100), // Limit detailed export
      timestamp: new Date().toISOString(),
      options: this.options
    }, null, 2)
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = []
    console.log('ApiMonitor: Reset all metrics')
  }

  /**
   * Update monitoring options
   */
  updateOptions(newOptions: Partial<ApiMonitoringOptions>): void {
    this.options = { ...this.options, ...newOptions }
  }
}

/**
 * Performance monitoring decorator for API routes
 */
export function monitorApi(options?: Partial<ApiMonitoringOptions>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const monitor = ApiMonitor.getInstance(options)

    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      const startTime = performance.now()
      
      try {
        const result = await originalMethod.apply(this, [request, ...args])
        
        const duration = performance.now() - startTime
        const metrics: ApiMetrics = {
          method: request.method,
          url: request.url,
          statusCode: result.status || 200,
          duration,
          requestSize: monitor['getRequestSize'](request),
          responseSize: 0, // Would need to measure response size
          timestamp: Date.now()
        }

        monitor.recordMetrics(metrics)
        return result

      } catch (error) {
        const duration = performance.now() - startTime
        
        const metrics: ApiMetrics = {
          method: request.method,
          url: request.url,
          statusCode: 500,
          duration,
          requestSize: monitor['getRequestSize'](request),
          responseSize: 0,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }

        monitor.recordMetrics(metrics)
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Global API monitor instance
 */
export const apiMonitor = ApiMonitor.getInstance()
