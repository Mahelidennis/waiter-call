/**
 * Performance Logging System
 * 
 * Structured logging for performance monitoring with different log levels,
 * structured output, and performance-specific formatting.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  category: string
  operation?: string
  duration?: number
  metadata?: Record<string, any>
  stack?: string
  userId?: string
  sessionId?: string
  requestId?: string
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  logFilePath?: string
  remoteEndpoint?: string
  structuredOutput: boolean
  includeTimestamp: boolean
  includeLevel: boolean
  includeCategory: boolean
  maxLogSize?: number
}

export interface PerformanceLogContext {
  operation: string
  startTime: number
  userId?: string
  sessionId?: string
  requestId?: string
  metadata?: Record<string, any>
}

export class PerformanceLogger {
  private static instance: PerformanceLogger | null = null
  private config: LoggerConfig
  private logs: LogEntry[] = []
  private logBuffer: string[] = []

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      structuredOutput: true,
      includeTimestamp: true,
      includeLevel: true,
      includeCategory: true,
      maxLogSize: 10000,
      ...config
    }
  }

  static getInstance(config?: Partial<LoggerConfig>): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger(config)
    }
    return PerformanceLogger.instance
  }

  /**
   * Log debug message
   */
  debug(message: string, category: string = 'DEBUG', metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, category, metadata)
  }

  /**
   * Log info message
   */
  info(message: string, category: string = 'INFO', metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, category, metadata)
  }

  /**
   * Log warning message
   */
  warn(message: string, category: string = 'WARN', metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, category, metadata)
  }

  /**
   * Log error message
   */
  error(message: string, category: string = 'ERROR', metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, category, metadata, error)
  }

  /**
   * Log critical message
   */
  critical(message: string, category: string = 'CRITICAL', metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.CRITICAL, message, category, metadata, error)
  }

  /**
   * Log performance operation
   */
  performance(operation: string, duration: number, category: string = 'PERFORMANCE', metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, operation, category, {
      ...metadata,
      operation,
      duration,
      performance: true
    })
  }

  /**
   * Start performance timing
   */
  startPerformanceTimer(context: PerformanceLogContext): PerformanceLogContext {
    return {
      ...context,
      startTime: performance.now()
    }
  }

  /**
   * End performance timing and log
   */
  endPerformanceTimer(context: PerformanceLogContext, metadata?: Record<string, any>): void {
    const duration = performance.now() - context.startTime
    
    this.performance(context.operation, duration, 'PERFORMANCE', {
      ...context.metadata,
      ...metadata
    })
  }

  /**
   * Log with automatic performance timing
   */
  withPerformanceTiming<T>(
    operation: string,
    category: string = 'PERFORMANCE',
    fn: (context: PerformanceLogContext) => T,
    metadata?: Record<string, any>
  ): T {
    const context = this.startPerformanceTimer({
      operation,
      startTime: performance.now(),
      metadata
    })
    
    try {
      const result = fn(context)
      this.endPerformanceTimer(context, { success: true })
      return result
    } catch (error) {
      this.endPerformanceTimer(context, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    category: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    // Check if we should log this level
    if (level < this.config.level) {
      return
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      operation: metadata?.operation,
      duration: metadata?.duration,
      metadata,
      stack: error?.stack,
      userId: metadata?.userId,
      sessionId: metadata?.sessionId,
      requestId: metadata?.requestId
    }

    // Add to logs array
    this.logs.push(logEntry)
    
    // Keep only recent logs
    if (this.logs.length > this.config.maxLogSize!) {
      this.logs = this.logs.slice(-this.config.maxLogSize!)
    }

    // Output to different destinations
    if (this.config.enableConsole) {
      this.logToConsole(logEntry)
    }

    if (this.config.enableFile) {
      this.logToFile(logEntry)
    }

    if (this.config.enableRemote) {
      this.logToRemote(logEntry)
    }
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const logMethod = this.getConsoleMethod(entry.level)
    const formattedMessage = this.formatLogMessage(entry)
    
    logMethod(formattedMessage)
  }

  /**
   * Log to file
   */
  private logToFile(entry: LogEntry): void {
    if (!this.config.logFilePath) return
    
    const formattedMessage = this.formatLogMessage(entry)
    this.logBuffer.push(formattedMessage)
    
    // Flush buffer periodically
    if (this.logBuffer.length >= 100) {
      this.flushLogBuffer()
    }
  }

  /**
   * Log to remote endpoint
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return
    
    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      })
      
      if (!response.ok) {
        console.error('Failed to send log to remote endpoint:', response.status)
      }
    } catch (error) {
      console.error('Error sending log to remote endpoint:', error)
    }
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): (message?: any, ...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
        return console.error
      case LogLevel.CRITICAL:
        return console.error
      default:
        return console.log
    }
  }

  /**
   * Format log message
   */
  private formatLogMessage(entry: LogEntry): string {
    const parts: string[] = []
    
    if (this.config.includeTimestamp) {
      parts.push(`[${entry.timestamp}]`)
    }
    
    if (this.config.includeLevel) {
      parts.push(`[${LogLevel[entry.level]}]`)
    }
    
    if (this.config.includeCategory) {
      parts.push(`[${entry.category}]`)
    }
    
    if (entry.operation) {
      parts.push(`[${entry.operation}]`)
    }
    
    if (entry.duration) {
      parts.push(`[${entry.duration.toFixed(2)}ms]`)
    }
    
    parts.push(entry.message)
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`| ${JSON.stringify(entry.metadata)}`)
    }
    
    return parts.join(' ')
  }

  /**
   * Flush log buffer to file
   */
  private flushLogBuffer(): void {
    if (!this.config.logFilePath || this.logBuffer.length === 0) return
    
    try {
      // In a real implementation, this would write to a file
      // For now, we'll just clear the buffer
      console.log(`Would write ${this.logBuffer.length} log entries to ${this.config.logFilePath}`)
      this.logBuffer = []
    } catch (error) {
      console.error('Error flushing log buffer:', error)
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    let logs = [...this.logs].reverse()
    
    if (level !== undefined) {
      logs = logs.filter(log => log.level >= level)
    }
    
    return logs.slice(0, count)
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string, count: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .reverse()
      .slice(0, count)
  }

  /**
   * Get logs by operation
   */
  getLogsByOperation(operation: string, count: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.operation === operation)
      .reverse()
      .slice(0, count)
  }

  /**
   * Get performance logs
   */
  getPerformanceLogs(count: number = 100): LogEntry[] {
    return this.getLogsByCategory('PERFORMANCE', count)
  }

  /**
   * Get error logs
   */
  getErrorLogs(count: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level >= LogLevel.ERROR)
      .reverse()
      .slice(0, count)
  }

  /**
   * Search logs
   */
  searchLogs(query: string, count: number = 100): LogEntry[] {
    const lowerQuery = query.toLowerCase()
    
    return this.logs
      .filter(log => 
        log.message.toLowerCase().includes(lowerQuery) ||
        log.category.toLowerCase().includes(lowerQuery) ||
        (log.operation && log.operation.toLowerCase().includes(lowerQuery)) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(lowerQuery))
      )
      .reverse()
      .slice(0, count)
  }

  /**
   * Get log statistics
   */
  getLogStatistics(): {
    totalLogs: number
    logsByLevel: Record<string, number>
    logsByCategory: Record<string, number>
    logsByOperation: Record<string, number>
    averageDuration: number
    errorRate: number
    recentActivity: number
  } {
    const totalLogs = this.logs.length
    const recentTime = Date.now() - (5 * 60 * 1000) // Last 5 minutes
    const recentActivity = this.logs.filter(log => new Date(log.timestamp).getTime() > recentTime).length

    // Count by level
    const logsByLevel: Record<string, number> = {}
    for (const level of Object.values(LogLevel).filter(value => typeof value === 'number') as LogLevel[]) {
      logsByLevel[LogLevel[level]] = this.logs.filter(log => log.level === level).length
    }

    // Count by category
    const logsByCategory: Record<string, number> = {}
    for (const log of this.logs) {
      logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1
    }

    // Count by operation
    const logsByOperation: Record<string, number> = {}
    for (const log of this.logs) {
      if (log.operation) {
        logsByOperation[log.operation] = (logsByOperation[log.operation] || 0) + 1
      }
    }

    // Calculate average duration for performance logs
    const performanceLogs = this.getPerformanceLogs()
    const durations = performanceLogs.filter(log => log.duration !== undefined).map(log => log.duration!)
    const averageDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0

    // Calculate error rate
    const errorLogs = this.getErrorLogs()
    const errorRate = totalLogs > 0 ? errorLogs.length / totalLogs : 0

    return {
      totalLogs,
      logsByLevel,
      logsByCategory,
      logsByOperation,
      averageDuration,
      errorRate,
      recentActivity
    }
  }

  /**
   * Export logs to JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      statistics: this.getLogStatistics(),
      config: this.config,
      timestamp: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
    this.logBuffer = []
    console.log('PerformanceLogger: Cleared all logs')
  }

  /**
   * Update logger configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  /**
   * Enable/disable console logging
   */
  setConsoleLogging(enabled: boolean): void {
    this.config.enableConsole = enabled
  }

  /**
   * Enable/disable file logging
   */
  setFileLogging(enabled: boolean, filePath?: string): void {
    this.config.enableFile = enabled
    if (filePath) {
      this.config.logFilePath = filePath
    }
  }

  /**
   * Enable/disable remote logging
   */
  setRemoteLogging(enabled: boolean, endpoint?: string): void {
    this.config.enableRemote = enabled
    if (endpoint) {
      this.config.remoteEndpoint = endpoint
    }
  }
}

/**
 * Performance logging utilities
 */
export class PerformanceLoggerUtils {
  /**
   * Create a performance timer
   */
  static createTimer(operation: string, metadata?: Record<string, any>): PerformanceTimer {
    return new PerformanceTimer(operation, metadata)
  }

  /**
   * Measure function execution time
   */
  static async measureTime<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now()
    const result = await fn()
    const duration = performance.now() - startTime
      
      const logger = PerformanceLogger.getInstance()
      logger.performance(operation, duration, 'PERFORMANCE', metadata)
      
      return { result, duration }
  }

  /**
   * Measure synchronous function execution time
   */
  static measureTimeSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): { result: T; duration: number } {
    const startTime = performance.now()
    const result = fn()
    const duration = performance.now() - startTime
      
      const logger = PerformanceLogger.getInstance()
      logger.performance(operation, duration, 'PERFORMANCE', metadata)
      
      return { result, duration }
  }

  /**
   * Log database operation performance
   */
  static logDatabaseOperation(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const logger = PerformanceLogger.getInstance()
    logger.performance(operation, duration, 'DATABASE', metadata)
  }

  /**
   * Log API operation performance
   */
  static logApiOperation(
    operation: string,
    duration: number,
    statusCode: number,
    metadata?: Record<string, any>
  ): void {
    const logger = PerformanceLogger.getInstance()
    logger.performance(operation, duration, 'API', {
      ...metadata,
      statusCode
    })
  }

  /**
   * Log realtime operation performance
   */
  static logRealtimeOperation(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const logger = PerformanceLogger.getInstance()
    logger.performance(operation, duration, 'REALTIME', metadata)
  }
}

/**
 * Performance timer class
 */
export class PerformanceTimer {
  private startTime: number
  private operation: string
  private metadata: Record<string, any>
  private logger: PerformanceLogger

  constructor(operation: string, metadata?: Record<string, any>) {
    this.operation = operation
    this.metadata = metadata || {}
    this.startTime = performance.now()
    this.logger = PerformanceLogger.getInstance()
  }

  end(additionalMetadata?: Record<string, any>): number {
    const duration = performance.now() - this.startTime
    
    this.logger.performance(
      this.operation,
      duration,
      'PERFORMANCE',
      {
        ...this.metadata,
        ...additionalMetadata
      }
    )
    
    return duration
  }

  getElapsed(): number {
    return performance.now() - this.startTime
  }
}

/**
 * Global logger instance
 */
export const logger = PerformanceLogger.getInstance()

/**
 * Convenience functions for different log levels
 */
export const logDebug = (message: string, category?: string, metadata?: Record<string, any>) => 
  logger.debug(message, category, metadata)

export const logInfo = (message: string, category?: string, metadata?: Record<string, any>) => 
  logger.info(message, category, metadata)

export const logWarn = (message: string, category?: string, metadata?: Record<string, any>) => 
  logger.warn(message, category, metadata)

export const logError = (message: string, category?: string, metadata?: Record<string, any>, error?: Error) => 
  logger.error(message, category, metadata, error)

export const logCritical = (message: string, category?: string, metadata?: Record<string, any>, error?: Error) => 
  logger.critical(message, category, metadata, error)

export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => 
  logger.performance(operation, duration, 'PERFORMANCE', metadata)
