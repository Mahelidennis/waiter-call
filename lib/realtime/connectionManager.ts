/**
 * Enhanced Realtime Connection Manager
 * 
 * Provides comprehensive cleanup, resource management, and monitoring for Supabase Realtime connections
 * with automatic memory leak prevention and connection pooling.
 */

import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supababase-js'

export interface ConnectionMetrics {
  totalConnections: number
  activeConnections: number
  failedConnections: number
  reconnectAttempts: number
  lastConnectionTime: number
  averageConnectionDuration: number
}

export interface ConnectionConfig {
  restaurantId: string
  waiterId?: string
  maxReconnectAttempts?: number
  reconnectDelay?: number
  connectionTimeout?: number
  heartbeatInterval?: number
}

export interface ConnectionCallbacks {
  onConnect?: (connectionId: string) => void
  onDisconnect?: (connectionId: string, reason: string) => void
  onError?: (connectionId: string, error: Error) => void
  onEvent?: (connectionId: string, event: any) => void
  onMetricsUpdate?: (metrics: ConnectionMetrics) => void
}

export interface ManagedConnection {
  id: string
  channel: RealtimeChannel
  config: ConnectionConfig
  callbacks: ConnectionCallbacks
  createdAt: number
  lastActivity: number
  reconnectAttempts: number
  isHealthy: boolean
  heartbeatInterval?: NodeJS.Timeout
}

/**
 * Enhanced Realtime Connection Manager
 */
export class RealtimeConnectionManager {
  private connections = new Map<string, ManagedConnection>()
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    reconnectAttempts: 0,
    lastConnectionTime: 0,
    averageConnectionDuration: 0
  }
  private cleanupInterval: NodeJS.Timeout | null = null
  private metricsUpdateInterval: NodeJS.Timeout | null = null

  constructor(
    private options: {
      maxConnections?: number
      cleanupIntervalMs?: number
      metricsUpdateIntervalMs?: number
      connectionTimeoutMs?: number
    } = {}
  ) {
    this.startCleanupScheduler()
    this.startMetricsUpdater()
  }

  /**
   * Create a new managed connection
   */
  async createConnection(
    config: ConnectionConfig,
    callbacks: ConnectionCallbacks = {}
  ): Promise<string> {
    const connectionId = this.generateConnectionId(config)
    
    // Check connection limits
    if (this.options.maxConnections && this.connections.size >= this.options.maxConnections) {
      throw new Error(`Maximum connections (${this.options.maxConnections}) reached`)
    }

    try {
      const channel = await this.setupChannel(config, callbacks, connectionId)
      
      const managedConnection: ManagedConnection = {
        id: connectionId,
        channel,
        config,
        callbacks,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        reconnectAttempts: 0,
        isHealthy: true
      }

      this.connections.set(connectionId, managedConnection)
      this.updateMetrics()
      
      console.log(`RealtimeConnectionManager: Connection created`, {
        connectionId,
        restaurantId: config.restaurantId,
        waiterId: config.waiterId,
        totalConnections: this.connections.size
      })

      callbacks.onConnect?.(connectionId)
      return connectionId

    } catch (error) {
      this.metrics.failedConnections++
      this.updateMetrics()
      
      console.error(`RealtimeConnectionManager: Failed to create connection`, {
        connectionId,
        restaurantId: config.restaurantId,
        error: error.message
      })
      
      callbacks.onError?.(connectionId, error as Error)
      throw error
    }
  }

  /**
   * Remove a connection
   */
  async removeConnection(connectionId: string, reason: string = 'manual'): Promise<void> {
    const connection = this.connections.get(connectionId)
    
    if (!connection) {
      console.warn(`RealtimeConnectionManager: Connection not found`, { connectionId })
      return
    }

    try {
      await this.cleanupConnection(connection, reason)
      this.connections.delete(connectionId)
      this.updateMetrics()
      
      console.log(`RealtimeConnectionManager: Connection removed`, {
        connectionId,
        restaurantId: connection.config.restaurantId,
        reason,
        remainingConnections: this.connections.size
      })

      callbacks.onDisconnect?.(connectionId, reason)
    } catch (error) {
      console.error(`RealtimeConnectionManager: Error removing connection`, {
        connectionId,
        error: error.message
      })
    }
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): ManagedConnection | undefined {
    return this.connections.get(connectionId)
  }

  /**
   * Get all connections
   */
  getAllConnections(): Map<string, ManagedConnection> {
    return new Map(this.connections)
  }

  /**
   * Get connections by restaurant
   */
  getConnectionsByRestaurant(restaurantId: string): Map<string, ManagedConnection> {
    const result = new Map<string, ManagedConnection>()
    
    for (const [id, connection] of this.connections) {
      if (connection.config.restaurantId === restaurantId) {
        result.set(id, connection)
      }
    }
    
    return result
  }

  /**
   * Get connections by waiter
   */
  getConnectionsByWaiter(waiterId: string): Map<string, ManagedConnection> {
    const result = new Map<string, ManagedConnection>()
    
    for (const [id, connection] of this.connections) {
      if (connection.config.waiterId === waiterId) {
        result.set(id, connection)
      }
    }
    
    return result
  }

  /**
   * Check connection health
   */
  isConnectionHealthy(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    return connection?.isHealthy ?? false
  }

  /**
   * Force cleanup of unhealthy connections
   */
  async cleanupUnhealthyConnections(): Promise<number> {
    const unhealthyConnections: string[] = []
    
    for (const [id, connection] of this.connections) {
      if (!connection.isHealthy || this.isConnectionStale(connection)) {
        unhealthyConnections.push(id)
      }
    }

    for (const connectionId of unhealthyConnections) {
      await this.removeConnection(connectionId, 'unhealthy')
    }

    return unhealthyConnections.length
  }

  /**
   * Get current metrics
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics }
  }

  /**
   * Setup Supabase channel with enhanced error handling
   */
  private async setupChannel(
    config: ConnectionConfig,
    callbacks: ConnectionCallbacks,
    connectionId: string
  ): Promise<RealtimeChannel> {
    const channel = supabase
      .channel(`restaurant-calls:${config.restaurantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Call',
        filter: `restaurantId=eq.${config.restaurantId}`
      }, (payload) => {
        this.handleRealtimeEvent(connectionId, payload, callbacks)
      })
      .on('broadcast', {
        event: 'connection_status'
      }, (payload) => {
        this.handleBroadcastEvent(connectionId, payload, callbacks)
      })
      .on('system', {
        event: '*'
      }, (payload) => {
        this.handleSystemEvent(connectionId, payload, callbacks)
      })
      .subscribe((status) => {
        this.handleSubscriptionStatus(connectionId, status, callbacks)
      })

    // Start heartbeat if configured
    if (config.heartbeatInterval) {
      this.startHeartbeat(connectionId, config.heartbeatInterval)
    }

    return channel
  }

  /**
   * Handle real-time events with error recovery
   */
  private handleRealtimeEvent(
    connectionId: string,
    payload: any,
    callbacks: ConnectionCallbacks
  ): void {
    const connection = this.connections.get(connectionId)
    
    if (!connection) {
      console.warn(`RealtimeConnectionManager: Event for unknown connection`, { connectionId })
      return
    }

    try {
      connection.lastActivity = Date.now()
      connection.isHealthy = true
      
      callbacks.onEvent?.(connectionId, payload)
    } catch (error) {
      console.error(`RealtimeConnectionManager: Error handling event`, {
        connectionId,
        error: error.message
      })
      
      connection.isHealthy = false
      callbacks.onError?.(connectionId, error as Error)
    }
  }

  /**
   * Handle broadcast events
   */
  private handleBroadcastEvent(
    connectionId: string,
    payload: any,
    callbacks: ConnectionCallbacks
  ): void {
    const connection = this.connections.get(connectionId)
    
    if (!connection) return

    try {
      if (payload.payload?.event === 'connection_status') {
        const connected = payload.payload.connected
        
        if (connected && !connection.isHealthy) {
          connection.isHealthy = true
          connection.lastActivity = Date.now()
        } else if (!connected && connection.isHealthy) {
          connection.isHealthy = false
          // Schedule reconnection
          this.scheduleReconnection(connectionId)
        }
      }
    } catch (error) {
      console.error(`RealtimeConnectionManager: Error handling broadcast`, {
        connectionId,
        error: error.message
      })
    }
  }

  /**
   * Handle system events
   */
  private handleSystemEvent(
    connectionId: string,
    payload: any,
    callbacks: ConnectionCallbacks
  ): void {
    const connection = this.connections.get(connectionId)
    
    if (!connection) return

    try {
      // Handle system events like errors, timeouts, etc.
      if (payload.event === 'error') {
        connection.isHealthy = false
        callbacks.onError?.(connectionId, new Error(payload.error?.message || 'Unknown system error'))
      }
    } catch (error) {
      console.error(`RealtimeConnectionManager: Error handling system event`, {
        connectionId,
        error: error.message
      })
    }
  }

  }
  
  /**
   * Handle subscription status changes
   */
  private handleSubscriptionStatus(
    connectionId: string,
    status: string,
    callbacks: ConnectionCallbacks
  ): void {
    const connection = this.connections.get(connectionId)
    
    if (!connection) return

    try {
      if (status === 'SUBSCRIBED') {
        connection.isHealthy = true
        connection.lastActivity = Date.now()
        connection.reconnectAttempts = 0
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        connection.isHealthy = false
        this.scheduleReconnection(connectionId)
      }
    } catch (error) {
      console.error(`RealtimeConnectionManager: Error handling subscription status`, {
        connectionId,
        status,
        error: error.message
      })
    }
  }

  /**
   * Start heartbeat for connection monitoring
   */
  private startHeartbeat(connectionId: string, intervalMs: number): void {
    const connection = this.connections.get(connectionId)
    
    if (!connection) return

    connection.heartbeatInterval = setInterval(() => {
      // Send heartbeat via broadcast
      connection.channel?.send({
        event: 'heartbeat',
        payload: {
          timestamp: Date.now(),
          connectionId
        }
      })
    }, intervalMs)
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    
    if (!connection) return

    const maxAttempts = connection.config.maxReconnectAttempts || 5
    const baseDelay = connection.config.reconnectDelay || 1000
    
    if (connection.reconnectAttempts >= maxAttempts) {
      console.error(`RealtimeConnectionManager: Max reconnection attempts reached`, {
        connectionId,
        attempts: connection.reconnectAttempts,
        maxAttempts
      })
      
      this.removeConnection(connectionId, 'max_reconnect_attempts')
      return
    }

    connection.reconnectAttempts++
    const delay = baseDelay * Math.pow(2, connection.reconnectAttempts - 1)
    
    console.log(`RealtimeConnectionManager: Scheduling reconnection`, {
      connectionId,
      attempt: connection.reconnectAttempts,
      maxAttempts,
      delay
    })

    setTimeout(() => {
      this.reconnectConnection(connectionId)
    }, delay)
  }

  /**
   * Reconnect a connection
   */
  private async reconnectConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    
    if (!connection) return

    try {
      // Clean up old channel
      if (connection.channel) {
        supabase.removeChannel(connection.channel)
      }

      // Create new channel
      connection.channel = await this.setupChannel(connection.config, connection.callbacks, connectionId)
      
      console.log(`RealtimeConnectionManager: Connection reconnected`, {
        connectionId,
        attempts: connection.reconnectAttempts
      })

    } catch (error) {
      console.error(`RealtimeConnectionManager: Reconnection failed`, {
        connectionId,
        error: error.message
      })
      
      connection.isHealthy = false
      connection.callbacks.onError?.(connectionId, error as Error)
      
      // Schedule another reconnection attempt
      this.scheduleReconnection(connectionId)
    }
  }

  /**
   * Check if connection is stale (no activity for too long)
   */
  private isConnectionStale(connection: ManagedConnection): boolean {
    const staleThreshold = 5 * 60 * 1000 // 5 minutes
    return Date.now() - connection.lastActivity > staleThreshold
  }

  /**
   * Clean up a specific connection
   */
  private async cleanupConnection(
    connection: ManagedConnection,
    reason: string
  ): Promise<void> {
    try {
      // Clear heartbeat
      if (connection.heartbeatInterval) {
        clearInterval(connection.heartbeatInterval)
        connection.heartbeatInterval = null
      }

      // Remove channel
      if (connection.channel) {
        await supabase.removeChannel(connection.channel)
        connection.channel = null
      }

      // Update metrics
      const duration = Date.now() - connection.createdAt
      this.metrics.averageConnectionDuration = 
        (this.metrics.averageConnectionDuration * this.metrics.totalConnections + duration) / 
        (this.metrics.totalConnections + 1)

    } catch (error) {
      console.error(`RealtimeConnectionManager: Error during cleanup`, {
        connectionId: connection.id,
        reason,
        error: error.message
      })
    }
  }

  /**
   * Update connection metrics
   */
  private updateMetrics(): void {
    this.metrics.totalConnections = this.connections.size
    this.metrics.activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isHealthy).length
    this.metrics.lastConnectionTime = Date.now()
    this.metrics.reconnectAttempts = Array.from(this.connections.values())
      .reduce((sum, conn) => sum + conn.reconnectAttempts, 0)
  }

  /**
   * Start periodic cleanup scheduler
   */
  private startCleanupScheduler(): void {
    const interval = this.options.cleanupIntervalMs || 60000 // 1 minute
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupUnhealthyConnections().then((cleaned) => {
        if (cleaned > 0) {
          console.log(`RealtimeConnectionManager: Cleaned up ${cleaned} unhealthy connections`)
        }
      })
    }, interval)
  }

  /**
   * Start metrics updater
   */
  private startMetricsUpdater(): void {
    const interval = this.options.metricsUpdateIntervalMs || 30000 // 30 seconds
    
    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetrics()
      
      // Notify about metrics update
      for (const connection of this.connections.values()) {
        connection.callbacks.onMetricsUpdate?.(this.metrics)
      }
    }, interval)
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(config: ConnectionConfig): string {
    const base = `${config.restaurantId}`
    const suffix = config.waiterId ? `-${config.waiterId}` : ''
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    
    return `${base}${suffix}-${timestamp}-${random}`
  }

  /**
   * Cleanup all connections and stop schedulers
   */
  async cleanup(): Promise<void> {
    console.log('RealtimeConnectionManager: Starting cleanup...')
    
    // Stop schedulers
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval)
      this.metricsUpdateInterval = null
    }

    // Remove all connections
    const connectionIds = Array.from(this.connections.keys())
    
    for (const connectionId of connectionIds) {
      await this.removeConnection(connectionId, 'shutdown')
    }

    console.log(`RealtimeConnectionManager: Cleanup complete. Removed ${connectionIds.length} connections`)
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    const connections = Array.from(this.connections.values())
    
    return {
      total: connections.length,
      healthy: connections.filter(c => c.isHealthy).length,
      unhealthy: connections.filter(c => !c.isHealthy).length,
      byRestaurant: connections.reduce((acc, conn) => {
        const restaurantId = conn.config.restaurantId
        acc[restaurantId] = (acc[restaurantId] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byWaiter: connections.reduce((acc, conn) => {
        const waiterId = conn.config.waiterId
        if (waiterId) {
          acc[waiterId] = (acc[waiterId] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      averageAge: connections.length > 0 
        ? connections.reduce((sum, conn) => sum + (Date.now() - conn.createdAt), 0) / connections.length 
        : 0,
      oldestConnection: connections.length > 0 
        ? Math.min(...connections.map(c => c.createdAt))
        : null,
      newestConnection: connections.length > 0 
        ? Math.max(...connections.map(c => c.createdAt))
        : null
    }
  }
}

// Singleton instance
let connectionManager: RealtimeConnectionManager | null = null

/**
 * Get or create the connection manager singleton
 */
export function getConnectionManager(options?: {
  maxConnections?: number
  cleanupIntervalMs?: number
  metricsUpdateIntervalMs?: number
  connectionTimeoutMs?: number
}): RealtimeConnectionManager {
  if (!connectionManager) {
    connectionManager = new RealtimeConnectionManager(options)
  }
  return connectionManager
}

/**
 * Cleanup the connection manager singleton
 */
export async function cleanupConnectionManager(): Promise<void> {
  if (connectionManager) {
    await connectionManager.cleanup()
    connectionManager = null
  }
}
