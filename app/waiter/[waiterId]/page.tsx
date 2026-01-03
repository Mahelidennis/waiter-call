'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Call {
  id: string
  tableId: string
  waiterId: string | null
  status: 'PENDING' | 'HANDLED' | 'CANCELLED'
  requestedAt: string
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
  const waiterId = params.waiterId as string
  const [calls, setCalls] = useState<Call[]>([])
  const [waiter, setWaiter] = useState<Waiter | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'my' | 'handled'>('all')
  const [newCallNotification, setNewCallNotification] = useState<Call | null>(null)

  useEffect(() => {
    fetchWaiter()
  }, [waiterId])

  useEffect(() => {
    if (waiter) {
      fetchCalls()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, waiter])

  useEffect(() => {
    if (!waiter) return

    const channel = supabase
      .channel(`waiter-calls-${waiterId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Call',
          filter: `status=eq.PENDING`,
        },
        (payload) => {
          fetchCalls()
          const newCall = payload.new as any
          setNewCallNotification(newCall)
          
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200])
          }
          
          setTimeout(() => {
            setNewCallNotification(null)
          }, 5000)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Call',
        },
        () => {
          fetchCalls()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [waiter, waiterId])

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

  async function fetchCalls() {
    try {
      if (!waiter) return
      
      // Fetch all calls for the restaurant, not just pending
      const response = await fetch(`/api/calls?restaurantId=${waiter.restaurantId}`)
      if (!response.ok) return
      
      const data = await response.json()
      // Filter based on current filter
      let filtered = data
      if (filter === 'my') {
        filtered = data.filter((call: Call) => call.waiterId === waiterId)
      } else if (filter === 'handled') {
        filtered = data.filter((call: Call) => call.status === 'HANDLED')
      } else {
        // For 'all' filter, show pending calls first
        filtered = data.filter((call: Call) => call.status === 'PENDING')
      }
      setCalls(filtered)
    } catch (error) {
      console.error('Error fetching calls:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCall(callId: string) {
    try {
      const response = await fetch(`/api/calls/${callId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'HANDLED',
          waiterId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update call')
      }

      fetchCalls()
    } catch (error) {
      console.error('Error handling call:', error)
      alert('Failed to update call. Please try again.')
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

  function getCardBorderColor(waitTimeSeconds: number): string {
    if (waitTimeSeconds > 300) return 'border-red-500' // > 5 minutes
    if (waitTimeSeconds > 120) return 'border-yellow-500' // > 2 minutes
    return 'border-gray-200' // New request
  }

  function getTimeColor(waitTimeSeconds: number): string {
    if (waitTimeSeconds > 300) return 'text-red-500'
    if (waitTimeSeconds > 120) return 'text-yellow-600 dark:text-yellow-500'
    return 'text-gray-600 dark:text-gray-300'
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
        <div className="flex flex-1 justify-center py-5 sm:px-4 md:px-8 lg:px-10">
          <div className="layout-content-container flex flex-col w-full max-w-2xl flex-1">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center gap-3 text-gray-800 dark:text-gray-100">
                <span className="material-symbols-outlined text-primary text-3xl">
                  table_restaurant
                </span>
                <h1 className="text-xl font-bold leading-tight tracking-tight">Live Dashboard</h1>
                <div className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-xs font-medium text-primary">LIVE</span>
                </div>
              </div>
              <div className="flex flex-1 justify-end gap-8">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-primary/20 flex items-center justify-center">
                  {waiter?.name ? (
                    <span className="text-primary font-bold text-lg">
                      {waiter.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-primary">person</span>
                  )}
                </div>
              </div>
            </header>

            {/* Filter Tabs */}
            <div className="p-4">
              <h2 className="text-gray-800 dark:text-gray-100 text-2xl font-bold leading-tight tracking-tight px-4 pb-3 pt-5">
                Incoming Requests
              </h2>
              <div className="flex gap-3 p-3 overflow-x-auto">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors ${
                    filter === 'all'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <p className="text-sm font-semibold leading-normal">All Requests</p>
                </button>
                <button
                  onClick={() => setFilter('my')}
                  className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors ${
                    filter === 'my'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium leading-normal">My Tables</p>
                </button>
                <button
                  onClick={() => setFilter('handled')}
                  className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors ${
                    filter === 'handled'
                      ? 'bg-primary text-background-dark'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium leading-normal">Handled</p>
                </button>
              </div>
            </div>

            {/* Calls List */}
            <div className="flex flex-col gap-4 px-4 pb-4">
              {filteredCalls.length === 0 ? (
                <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <span className="material-symbols-outlined text-primary text-4xl">
                      notifications_off
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold">
                      All tables are happy!
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No active requests at the moment. New calls will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                filteredCalls.map((call) => {
                  const waitTime = getWaitTimeInSeconds(call.requestedAt)
                  const borderColor = getCardBorderColor(waitTime)
                  const timeColor = getTimeColor(waitTime)

                  return (
                    <div
                      key={call.id}
                      className={`flex flex-col sm:flex-row items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-background-dark dark:border p-4 shadow-lg border-2 ${borderColor}`}
                    >
                      <div className="flex flex-1 flex-col justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <p className={`${timeColor} text-sm font-semibold leading-normal`}>
                            {getTimeAgo(call.requestedAt)}
                          </p>
                          <p className="text-gray-900 dark:text-gray-50 text-2xl font-bold leading-tight">
                            Table {call.table.number}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                            Call Waiter
                          </p>
                        </div>
                        <button
                          onClick={() => handleCall(call.id)}
                          className="flex w-full sm:w-fit min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 gap-2 bg-primary text-background-dark text-sm font-bold leading-normal hover:bg-primary/90 transition-colors"
                        >
                          <span className="truncate">Mark as Handled</span>
                          <span className="material-symbols-outlined text-lg">done</span>
                        </button>
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
