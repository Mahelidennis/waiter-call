'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getRealtimeManager, cleanupRealtimeManager, CallRealtimeEvent } from '@/lib/realtime/calls'
import PushToggle from '@/components/PushToggle'

interface Call {
  id: string
  tableId: string
  waiterId: string | null
  status: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED' | 'HANDLED'
  requestedAt: string
  acknowledgedAt: string | null
  completedAt: string | null
  missedAt: string | null
  timeoutAt: string | null // Restored - database now has this column
  // Legacy fields for backward compatibility
  handledAt: string | null
  responseTime: number | null
  table: {
    id: string
    number: string
  }
  waiter: {
    id: string
    name: string
  } | null
}

interface Waiter {
  id: string
  name: string
  email?: string
  restaurantId: string
}

export default function WaiterDashboard() {
  const params = useParams()
  const router = useRouter()
  const waiterId = params.waiterId as string
  const [calls, setCalls] = useState<Call[]>([])
  const [waiter, setWaiter] = useState<Waiter | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollingLoading, setPollingLoading] = useState(false) // Track polling state
  const [filter, setFilter] = useState<'all' | 'pending' | 'acknowledged' | 'in_progress' | 'missed' | 'my' | 'handled'>('pending')
  const [newCallNotification, setNewCallNotification] = useState<Call | null>(null)
  const [previousCalls, setPreviousCalls] = useState<Call[]>([]) // Track previous calls for change detection
  const [highlightedCallId, setHighlightedCallId] = useState<string | null>(null) // For push notification highlighting
  
  // Realtime state management
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [realtimeError, setRealtimeError] = useState<string | null>(null)
  const realtimeManager = getRealtimeManager()

  async function handleLogout() {
    try {
      await fetch('/api/auth/waiter/logout', { method: 'POST' })
      router.push('/waiter/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if logout API fails
      router.push('/waiter/login')
    }
  }

  useEffect(() => {
    fetchWaiter()
  }, [waiterId])

  // Handle callId from URL parameter (for push notifications)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const callId = urlParams.get('callId')
      if (callId) {
        setHighlightedCallId(callId)
        // Clear the parameter from URL after handling
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
        
        // Clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedCallId(null)
        }, 5000)
      }
    }
  }, [])

  // Remove the manual fetchCalls effect since polling handles it

  // Real-time and polling integration
  useEffect(() => {
    if (!waiter) return

    console.log(' WAITER DASHBOARD: Setting up realtime for waiter', waiter.id, 'restaurant', waiter.restaurantId)

    // Set up real-time subscription
    const setupRealtime = () => {
      console.log(' WAITER DASHBOARD: Subscribing to realtime')
      realtimeManager.subscribe({
        restaurantId: waiter.restaurantId,
        waiterId: waiter.id,
        onCallEvent: handleRealtimeEvent,
        onConnectionChange: (connected) => {
          console.log(' WAITER DASHBOARD: Realtime connection changed:', connected)
          setIsRealtimeConnected(connected)
          setRealtimeError(null)
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Realtime connection status:', connected)
          }
        },
        onError: (error) => {
          console.error(' WAITER DASHBOARD: Realtime error:', error)
          setRealtimeError(error.message)
        }
      })
    }

    // Handle real-time events
    const handleRealtimeEvent = (event: CallRealtimeEvent) => {
      console.log(' WAITER DASHBOARD: Realtime event received:', event.eventType, event.new?.id)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Realtime event received:', event.eventType, event.new?.id)
      }

      setCalls(currentCalls => {
        let updatedCalls = [...currentCalls]

        switch (event.eventType) {
          case 'INSERT':
            // Add new call
            if (event.new) {
              updatedCalls.unshift(event.new as Call)
              
              // Show notification for new pending calls assigned to this waiter
              if (event.new.status === 'PENDING' && 
                  (event.new.waiterId === waiterId || !event.new.waiterId)) {
                console.log(' WAITER DASHBOARD: NEW CALL NOTIFICATION for waiter', waiterId)
                setNewCallNotification(event.new as Call)
                
                // Vibrate if supported
                if ('vibrate' in navigator) {
                  navigator.vibrate([200, 100, 200])
                }
                
                // Clear notification after 5 seconds
                setTimeout(() => {
                  setNewCallNotification(null)
                }, 5000)
              }
            }
            break

          case 'UPDATE':
            // Update existing call
            if (event.new) {
              const index = updatedCalls.findIndex(call => call.id === event.new.id)
              if (index !== -1) {
                updatedCalls[index] = event.new as Call
              } else {
                // Call might be newly assigned to this waiter
                if (event.new.waiterId === waiter.id) {
                  updatedCalls.unshift(event.new as Call)
                }
              }
            }
            break

          case 'DELETE':
            // Remove call
            if (event.old) {
              updatedCalls = updatedCalls.filter(call => call.id !== event.old.id)
            }
            break
        }

        // Maintain sorting: priority (status) + creation time
        return updatedCalls.sort((a, b) => {
          // Priority order: PENDING first, then by creation time
          const statusOrder = {
            'PENDING': 0,
            'ACKNOWLEDGED': 1,
            'IN_PROGRESS': 2,
            'MISSED': 3,
            'COMPLETED': 4,
            'HANDLED': 4,
            'CANCELLED': 5
          }
          
          const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 999
          const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 999
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder
          }
          
          // Same priority, sort by creation time (newest first)
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
        })
      })
    }

    // Set up polling as fallback (longer interval when realtime is active)
    const POLLING_INTERVAL = isRealtimeConnected ? 30000 : 15000 // 30s with realtime, 15s fallback
    let intervalId: NodeJS.Timeout | null = null

    const startPolling = () => {
      // Initial fetch (not polling)
      fetchCalls(false)
      
      // Set up periodic polling
      intervalId = setInterval(() => {
        fetchCalls(true) // Mark as polling
      }, POLLING_INTERVAL)
    }

    // Initialize realtime
    setupRealtime()
    
    // Start polling as fallback
    startPolling()

    return () => {
      console.log('🔔 WAITER DASHBOARD: Cleanup - DO NOT destroy realtime manager (singleton)')
      // Only clear polling, keep realtime manager alive for other components
      if (intervalId) {
        clearInterval(intervalId)
      }
      // NOTE: We DON'T call realtimeManager.unsubscribe() here to preserve the singleton
    }
  }, [waiterId]) // Only depend on waiterId, not filter or connection status

  async function fetchWaiter() {
    try {
      const response = await fetch(`/api/waiters/${waiterId}`)
      if (!response.ok) {
        setLoading(false)
        return
      }
      const data = await response.json()
      setWaiter(data)
    } catch (error) {
      console.error('Error fetching waiter:', error)
      setLoading(false)
    }
  }

  async function fetchCalls(isPolling = false) {
    try {
      if (!waiter) return
      
      // Set polling loading state (but not for initial load)
      if (isPolling) {
        setPollingLoading(true)
      }
      
      // Use the enhanced waiter-specific API endpoint
      let statusFilter = filter // Use filter directly as it matches API options
      
      const response = await fetch(`/api/waiter/calls?status=${statusFilter}`)
      if (!response.ok) return
      
      const data = await response.json()
      
      // Update calls and previous calls
      setCalls(data)
      setPreviousCalls(data)
    } catch (error) {
      console.error('Error fetching calls:', error)
    } finally {
      setLoading(false)
      setPollingLoading(false)
    }
  }

  async function acknowledgeCall(callId: string) {
    try {
      const response = await fetch(`/api/waiter/calls/${callId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to acknowledge call')
      }

      // Reset previous calls to prevent false notifications
      setPreviousCalls(calls)
      fetchCalls(false) // Refresh the calls list (not polling)
    } catch (error) {
      console.error('Error acknowledging call:', error)
      alert(error instanceof Error ? error.message : 'Failed to acknowledge call. Please try again.')
    }
  }

  async function resolveCall(callId: string) {
    try {
      const response = await fetch(`/api/waiter/calls/${callId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete call')
      }

      // Reset previous calls to prevent false notifications
      setPreviousCalls(calls)
      fetchCalls(false) // Refresh the calls list (not polling)
    } catch (error) {
      console.error('Error completing call:', error)
      alert(error instanceof Error ? error.message : 'Failed to complete call. Please try again.')
    }
  }

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    const minutes = Math.floor(diff / 60)
    if (minutes < 60) return `${minutes}m ${diff % 60}s ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m ago`
  }

  function getWaitTimeInSeconds(dateString: string): number {
    const date = new Date(dateString)
    const now = new Date()
    return Math.floor((now.getTime() - date.getTime()) / 1000)
  }

  function getCardBorderColor(call: Call): string {
    const waitTime = getWaitTimeInSeconds(call.requestedAt)
    
    // Enhanced priority logic for different states
    if (call.status === 'MISSED') return 'border-red-500' // Missed calls are highest priority
    if (call.status === 'PENDING') return 'border-yellow-500' // PENDING calls need attention
    if (waitTime > 300) return 'border-red-500' // > 5 minutes
    if (waitTime > 120) return 'border-yellow-500' // > 2 minutes
    return 'border-gray-200' // New request
  }

  function getTimeColor(call: Call): string {
    const waitTime = getWaitTimeInSeconds(call.requestedAt)
    
    if (call.status === 'MISSED') return 'text-red-500'
    if (call.status === 'COMPLETED') return 'text-green-600'
    if (call.status === 'ACKNOWLEDGED' || call.status === 'IN_PROGRESS') return 'text-blue-600'
    if (waitTime > 300) return 'text-red-500'
    if (waitTime > 120) return 'text-yellow-600 dark:text-yellow-500'
    return 'text-gray-600 dark:text-gray-300'
  }

  function getStatusBadge(call: Call): { text: string; color: string } {
    switch (call.status) {
      case 'PENDING':
        return { text: 'New', color: 'bg-green-100 text-green-700' }
      case 'ACKNOWLEDGED':
        return { text: 'Acknowledged', color: 'bg-blue-100 text-blue-700' }
      case 'IN_PROGRESS':
        return { text: 'On the way', color: 'bg-purple-100 text-purple-700' }
      case 'COMPLETED':
      case 'HANDLED':
        return { text: 'Completed', color: 'bg-gray-100 text-gray-700' }
      case 'MISSED':
        return { text: 'MISSED', color: 'bg-red-100 text-red-700' }
      case 'CANCELLED':
        return { text: 'Cancelled', color: 'bg-gray-100 text-gray-700' }
      default:
        return { text: call.status, color: 'bg-gray-100 text-gray-700' }
    }
  }

  function isCallOverdue(call: Call): boolean {
    // timeoutAt removed - always return false until database schema is updated
    return false
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const filteredCalls = calls.filter((call) => {
    if (filter === 'my') return call.waiterId === waiterId
    if (filter === 'handled') return call.status === 'HANDLED'
    return true
  })

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-3 sm:py-5 px-2 sm:px-4 md:px-8 lg:px-10">
          <div className="layout-content-container flex flex-col w-full max-w-2xl flex-1">
            {/* Real-time notification banner */}
            {newCallNotification && (
              <div className="mx-2 sm:mx-4 mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="material-symbols-outlined text-green-600 text-xl sm:text-2xl">
                      notifications_active
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-green-800 text-sm sm:text-base">New Table Call</p>
                      <p className="text-sm text-green-700">
                        Table {newCallNotification.table.number} needs assistance
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNewCallNotification(null)}
                    className="text-green-600 hover:text-green-800 p-1 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg sm:text-xl">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b-2 border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-3 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2 sm:gap-3 text-gray-900 dark:text-gray-100 min-w-0 flex-1">
                <img 
                  src="/logo.png" 
                  alt="WaiterCall Logo" 
                  className="h-6 sm:h-8 w-auto flex-shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight truncate text-gray-900 dark:text-white">Live Dashboard</h1>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">WaiterCall System</p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 rounded-full bg-green-600/20 px-2 sm:px-3 py-1 flex-shrink-0 border border-green-300">
                  <div className={`h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full ${
                    isRealtimeConnected 
                      ? 'bg-green-600 animate-pulse' 
                      : 'bg-yellow-600 animate-pulse'
                  }`}></div>
                  <span className={`text-xs font-bold ${
                    isRealtimeConnected 
                      ? 'text-green-700' 
                      : 'text-yellow-700'
                  }`}>
                    {isRealtimeConnected ? 'LIVE' : 'POLLING'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {realtimeError && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-600 hidden sm:flex">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>Issues</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (!isRealtimeConnected) {
                      realtimeManager.reconnect()
                    }
                  }}
                  className="flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isRealtimeConnected ? 'Connected' : 'Reconnect'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isRealtimeConnected ? 'refresh' : 'sync'}
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 sm:size-10 bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  {waiter?.name ? (
                    <span className="text-primary font-bold text-sm sm:text-lg">
                      {waiter.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-primary text-sm sm:text-base">person</span>
                  )}
                </div>
              </div>
            </header>

            {/* Filter Tabs */}
            <div className="p-2 sm:p-4 bg-white dark:bg-gray-900">
              <h2 className="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-tight px-2 sm:px-4 pb-3 pt-3 sm:pt-5">
                Incoming Requests
              </h2>
              <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setFilter('pending')}
                  className={`flex h-10 sm:h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-3 sm:px-4 transition-colors min-w-[44px] min-h-[44px] font-semibold text-sm ${
                    filter === 'pending'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="truncate">Pending</span>
                </button>
                <button
                  onClick={() => setFilter('acknowledged')}
                  className={`flex h-10 sm:h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-3 sm:px-4 transition-colors min-w-[44px] min-h-[44px] font-semibold text-sm ${
                    filter === 'acknowledged'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="truncate">Acknowledged</span>
                </button>
                <button
                  onClick={() => setFilter('in_progress')}
                  className={`flex h-10 sm:h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-3 sm:px-4 transition-colors min-w-[44px] min-h-[44px] font-semibold text-sm ${
                    filter === 'in_progress'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="truncate">On the way</span>
                </button>
                <button
                  onClick={() => setFilter('missed')}
                  className={`flex h-10 sm:h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-3 sm:px-4 transition-colors min-w-[44px] min-h-[44px] font-semibold text-sm ${
                    filter === 'missed'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="truncate">Missed</span>
                </button>
                <button
                  onClick={() => setFilter('my')}
                  className={`flex h-10 sm:h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-3 sm:px-4 transition-colors min-w-[44px] min-h-[44px] font-semibold text-sm ${
                    filter === 'my'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="truncate">My Tables</span>
                </button>
                <button
                  onClick={() => setFilter('handled')}
                  className={`flex h-10 sm:h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-3 sm:px-4 transition-colors min-w-[44px] min-h-[44px] font-semibold text-sm ${
                    filter === 'handled'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="truncate">Completed</span>
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`flex h-10 sm:h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-3 sm:px-4 transition-colors min-w-[44px] min-h-[44px] font-semibold text-sm ${
                    filter === 'all'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="truncate">All</span>
                </button>
              </div>
            </div>

            {/* Calls List */}
            <div className="flex flex-col gap-3 sm:gap-4 px-2 sm:px-4 pb-4 pb-[env(safe-area-inset-bottom)] bg-gray-50 dark:bg-gray-800">
              {filteredCalls.length === 0 ? (
                <div className="mt-4 sm:mt-8 flex flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 sm:p-12 text-center bg-white dark:bg-gray-900">
                  <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/20 border-2 border-primary/30">
                    <span className="material-symbols-outlined text-primary text-3xl sm:text-4xl">
                      notifications_off
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-gray-900 dark:text-white text-base sm:text-lg font-bold">
                      All tables are happy!
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      No active requests at the moment. New calls will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                filteredCalls.map((call) => {
                  const borderColor = getCardBorderColor(call)
                  const timeColor = getTimeColor(call)
                  const statusBadge = getStatusBadge(call)
                  const isOverdue = isCallOverdue(call)
                  
                  // Determine call state for enhanced lifecycle
                  const isPending = call.status === 'PENDING' && !call.waiterId
                  const isAcknowledged = call.status === 'ACKNOWLEDGED' && call.waiterId === waiterId
                  const isInProgress = call.status === 'IN_PROGRESS' && call.waiterId === waiterId
                  const isCompleted = ['COMPLETED', 'HANDLED'].includes(call.status) && call.waiterId === waiterId
                  const isMissed = call.status === 'MISSED' && call.waiterId === waiterId

                  return (
                    <div
                      key={call.id}
                      className={`flex flex-col items-stretch justify-between gap-3 sm:gap-4 rounded-xl bg-white dark:bg-gray-900 dark:border p-3 sm:p-4 shadow-lg border-2 ${borderColor} ${
                        highlightedCallId === call.id 
                          ? 'ring-4 ring-green-400 ring-opacity-50 animate-pulse' 
                          : ''
                      }`}
                    >
                      <div className="flex flex-1 flex-col justify-between gap-3 sm:gap-4">
                        <div className="flex flex-col gap-2">
                          {/* Status badge and time */}
                          <div className="flex items-center justify-between">
                            <p className={`${timeColor} text-sm font-bold leading-normal`}>
                              {getTimeAgo(call.requestedAt)}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge.color} border border-gray-300 dark:border-gray-600`}>
                              {statusBadge.text}
                            </span>
                          </div>
                          
                          <p className="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold leading-tight">
                            Table {call.table.number}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-semibold leading-normal">
                            Call Waiter
                          </p>
                          
                          {/* Status-specific messages */}
                          {isOverdue && (
                            <p className="text-red-700 dark:text-red-400 text-sm font-bold">
                              ⚠️ Overdue - SLA exceeded
                            </p>
                          )}
                          
                          {isAcknowledged && (
                            <p className="text-blue-700 dark:text-blue-400 text-sm font-bold">
                              Acknowledged by you
                            </p>
                          )}
                          
                          {isInProgress && (
                            <p className="text-purple-700 dark:text-purple-400 text-sm font-bold">
                              On the way to table
                            </p>
                          )}
                          
                          {isCompleted && (
                            <p className="text-green-700 dark:text-green-400 text-sm font-bold">
                              Service completed
                            </p>
                          )}
                          
                          {isMissed && (
                            <p className="text-red-700 dark:text-red-400 text-sm font-bold">
                              ❌ Missed - Customer waited too long
                            </p>
                          )}
                        </div>
                        
                        {/* Action buttons based on state */}
                        {isPending && (
                          <button
                            onClick={() => acknowledgeCall(call.id)}
                            className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 sm:h-10 px-4 sm:px-5 gap-2 bg-blue-600 text-white text-sm font-bold leading-normal hover:bg-blue-700 transition-colors min-h-[44px] shadow-md"
                          >
                            <span className="truncate">Acknowledge</span>
                            <span className="material-symbols-outlined text-lg sm:text-base">check</span>
                          </button>
                        )}
                        
                        {(isAcknowledged || isInProgress) && (
                          <button
                            onClick={() => resolveCall(call.id)}
                            className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 sm:h-10 px-4 sm:px-5 gap-2 bg-primary text-background-dark text-sm font-bold leading-normal hover:bg-primary/90 transition-colors min-h-[44px] shadow-md"
                          >
                            <span className="truncate">Complete</span>
                            <span className="material-symbols-outlined text-lg sm:text-base">done</span>
                          </button>
                        )}
                        
                        {isCompleted && (
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold">
                            <span className="material-symbols-outlined">check_circle</span>
                            <span className="text-sm font-bold">Completed</span>
                          </div>
                        )}
                        
                        {isMissed && (
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
                            <span className="material-symbols-outlined">error</span>
                            <span className="text-sm font-bold">Missed</span>
                          </div>
                        )}
                      </div>
                      <div className="w-full sm:w-32 h-32 bg-center bg-no-repeat aspect-square bg-cover rounded-lg flex-shrink-0 bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-5xl">
                          table_restaurant
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
