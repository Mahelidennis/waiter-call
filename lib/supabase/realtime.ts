import { supabase } from './client'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Subscribe to new waiter calls for a specific restaurant
 */
export function subscribeToCalls(
  restaurantId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`calls:${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Call',
        filter: `restaurantId=eq.${restaurantId}`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'Call',
        filter: `restaurantId=eq.${restaurantId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to calls for a specific waiter
 */
export function subscribeToWaiterCalls(
  waiterId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`waiter-calls:${waiterId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Call',
        filter: `waiterId=eq.${waiterId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel: RealtimeChannel) {
  return supabase.removeChannel(channel)
}

