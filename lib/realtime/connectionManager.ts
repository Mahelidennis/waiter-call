/**
 * Enhanced Realtime Connection Manager
 * 
 * Provides comprehensive cleanup, resource management, and monitoring for Supabase Realtime connections
 * with automatic memory leak prevention and connection pooling.
 */

import { supabase } from '@/lib/supabase/client'
// @ts-ignore - RealtimeChannel type is available but might not be properly exported
type RealtimeChannel = ReturnType<typeof supabase.channel>

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
  tableId?: string
  heartbeatInterval?: number
}

export interface ConnectionCallbacks {
  onConnect?: (connectionId: string) => void
  onDisconnect?: (connectionId: string, reason: string) => void
  onError?: (connectionId: string, error: Error) => void
  onEvent?: (connectionId: string, event: any) => void
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
}

export class RealtimeConnectionManager {
  private connections: Map<string, ManagedConnection> = new Map()
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
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      callbacks.onError?.(connectionId, error instanceof Error ? error : new Error('Unknown error'))
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

      connection.callbacks.onDisconnect?.(connectionId, reason)
    } catch (error) {
      console.error(`RealtimeConnectionManager: Error removing connection`, {
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error'
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
   * Cleanup unhealthy connections
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
   * Setup Supabase channel with event handlers
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
   * Handle realtime database events
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

    connection.lastActivity = Date.now()
    callbacks.onEvent?.(connectionId, payload)
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

    connection.lastActivity = Date.now()

    if (payload.event === 'heartbeat') {
      const connected = payload.data?.connected ?? false
      
      if (connected && !connection.isHealthy) {
        connection.isHealthy = true
        connection.reconnectAttempts = 0
      } else if (!connected && connection.isHealthy) {
        connection.isHealthy = false
        this.scheduleReconnection(connectionId)
      }
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

    connection.lastActivity = Date.now()
    callbacks.onEvent?.(connectionId, payload)
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
        connection.reconnectAttempts = 0
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        connection.isHealthy = false
        this.scheduleReconnection(connectionId)
      }
    } catch (error) {
      console.error(`RealtimeConnectionManager: Error handling subscription status`, {
        connectionId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(config: ConnectionConfig): string {
    return `${config.restaurantId}-${config.waiterId || 'anonymous'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Start cleanup scheduler
   */
  private startCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupUnhealthyConnections()
    }, this.options.cleanupIntervalMs || 60000) // 1 minute default
  }

  /**
   * Start metrics updater
   */
  private startMetricsUpdater(): void {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval)
    }

    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetrics()
    }, this.options.metricsUpdateIntervalMs || 30000) // 30 seconds default
  }

  /**
   * Update connection metrics
   */
  private updateMetrics(): void {
    const connections = Array.from(this.connections.values())
    
    this.metrics.totalConnections = connections.length
    this.metrics.activeConnections = connections.filter(c => c.isHealthy).length
    this.metrics.lastConnectionTime = connections.length > 0 
      ? Math.max(...connections.map(c => c.createdAt))
      : 0

    if (connections.length > 0) {
      const totalDuration = connections.reduce((sum, c) => sum + (Date.now() - c.createdAt), 0)
      this.metrics.averageConnectionDuration = totalDuration / connections.length
    } else {
      this.metrics.averageConnectionDuration = 0
    }
  }

  /**
   * Cleanup a connection
   */
  private async cleanupConnection(connection: ManagedConnection, reason: string): Promise<void> {
    try {
      // Unsubscribe and close channel
      if (connection.channel) {
        await connection.channel.unsubscribe()
      }
    } catch (error) {
      console.error(`RealtimeConnectionManager: Error during connection cleanup`, {
        connectionId: connection.id,
        reason,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Check if connection is stale
   */
  private isConnectionStale(connection: ManagedConnection): boolean {
    const staleThreshold = this.options.connectionTimeoutMs || 300000 // 5 minutes default
    return Date.now() - connection.lastActivity > staleThreshold
  }

  /**
   * Start heartbeat for connection monitoring
   */
  private startHeartbeat(connectionId: string, intervalMs: number): void {
    const connection = this.connections.get(connectionId)
    
    if (!connection) return

    const interval = setInterval(() => {
      if (!this.connections.has(connectionId)) {
        clearInterval(interval)
        return
      }

      connection.channel.send({
        type: 'broadcast',
        event: 'heartbeat',
        payload: { timestamp: Date.now() }
      })
    }, intervalMs)
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    
    if (!connection) return

    const maxAttempts = 5
    const baseDelay = 1000 // 1 second
    
    if (connection.reconnectAttempts >= maxAttempts) {
      console.warn(`RealtimeConnectionManager: Max reconnection attempts reached`, {
        connectionId,
        attempts: connection.reconnectAttempts
      })
      
      this.removeConnection(connectionId, 'max_reconnect_attempts')
      return
    }

    const delay = baseDelay * Math.pow(2, connection.reconnectAttempts)
    connection.reconnectAttempts++

    console.log(`RealtimeConnectionManager: Scheduling reconnection`, {
      connectionId,
      attempt: connection.reconnectAttempts,
      delay,
      maxAttempts
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
      console.log(`RealtimeConnectionManager: Reconnecting`, { connectionId })

      // Create new channel
      connection.channel = await this.setupChannel(connection.config, connection.callbacks, connectionId)
      
      console.log(`RealtimeConnectionManager: Connection reconnected`, {
        connectionId,
        restaurantId: connection.config.restaurantId
      })

    } catch (error) {
      console.error(`RealtimeConnectionManager: Reconnection failed`, {
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      connection.callbacks.onError?.(connectionId, error instanceof Error ? error : new Error('Unknown error'))
      
      // Schedule another reconnection attempt
      this.scheduleReconnection(connectionId)
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    total: number
    healthy: number
    unhealthy: number
    byRestaurant: Record<string, number>
    byWaiter: Record<string, number>
  } {
    const connections = Array.from(this.connections.values())
    const byRestaurant: Record<string, number> = {}
    const byWaiter: Record<string, number> = {}

    for (const connection of connections) {
      byRestaurant[connection.config.restaurantId] = (byRestaurant[connection.config.restaurantId] || 0) + 1
      
      if (connection.config.waiterId) {
        byWaiter[connection.config.waiterId] = (byWaiter[connection.config.waiterId] || 0) + 1
      }
    }

    return {
      total: connections.length,
      healthy: connections.filter(c => c.isHealthy).length,
      unhealthy: connections.filter(c => !c.isHealthy).length,
      byRestaurant,
      byWaiter
    }
  }

  /**
   * Cleanup all connections and intervals
   */
  async cleanup(): Promise<void> {
    console.log(`RealtimeConnectionManager: Starting cleanup`, {
      totalConnections: this.connections.size
    })

    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval)
      this.metricsUpdateInterval = null
    }

    // Cleanup all connections
    const connectionIds = Array.from(this.connections.keys())
    for (const connectionId of connectionIds) {
      await this.removeConnection(connectionId, 'cleanup')
    }

    console.log(`RealtimeConnectionManager: Cleanup completed`)
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
