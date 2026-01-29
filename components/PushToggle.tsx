'use client'

import { useState, useEffect } from 'react'
import { 
  getPushStatus, 
  enablePushNotifications, 
  disablePushNotifications,
  PUSH_ENABLED,
  type PushStatus 
} from '@/lib/push/subscription'

interface PushToggleProps {
  className?: string
}

// Simple icon components using text/emoji
const NotificationIcon = ({ enabled }: { enabled: boolean }) => (
  <span className="text-lg">{enabled ? '🔔' : '🔕'}</span>
)

const WarningIcon = () => <span className="text-lg">⚠️</span>
const LoadingIcon = () => <span className="text-lg">⏳</span>

export default function PushToggle({ className = '' }: PushToggleProps) {
  const [status, setStatus] = useState<PushStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load current status on mount
  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const pushStatus = await getPushStatus()
      setStatus(pushStatus)
      setError(null)
    } catch (err) {
      console.error('Failed to load push status:', err)
      setError('Failed to check notification status')
    }
  }

  const handleEnable = async () => {
    if (!PUSH_ENABLED) {
      setError('Push notifications are not enabled')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await enablePushNotifications()
      await loadStatus() // Refresh status
    } catch (err) {
      console.error('Failed to enable push notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to enable notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    setError(null)

    try {
      await disablePushNotifications()
      await loadStatus() // Refresh status
    } catch (err) {
      console.error('Failed to disable push notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to disable notifications')
    } finally {
      setLoading(false)
    }
  }

  // Don't render if push is disabled
  if (!PUSH_ENABLED) {
    return null
  }

  // Loading state
  if (!status) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <LoadingIcon />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  // Not supported
  if (!status.supported) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <NotificationIcon enabled={false} />
        <span className="text-sm">Notifications not supported</span>
      </div>
    )
  }

  // iOS Safari limitation notice
  if (status.iosLimited) {
    return (
      <div className={`flex items-center space-x-2 text-yellow-600 ${className}`}>
        <WarningIcon />
        <span className="text-sm">iOS: Keep Safari open for notifications</span>
      </div>
    )
  }

  // Permission denied
  if (status.permission === 'denied') {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <NotificationIcon enabled={false} />
        <span className="text-sm">Notifications blocked</span>
        <button
          onClick={() => {
            // Instructions to unblock in browser settings
            alert('To enable notifications:\n1. Click the lock/icon in address bar\n2. Set notifications to "Allow"')
          }}
          className="text-xs underline ml-2"
        >
          How to fix
        </button>
      </div>
    )
  }

  // Subscribed and enabled
  if (status.subscribed && status.permission === 'granted') {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <NotificationIcon enabled={true} />
        <span className="text-sm">Notifications enabled</span>
        <button
          onClick={handleDisable}
          disabled={loading}
          className="text-xs underline ml-2 disabled:opacity-50"
        >
          {loading ? 'Disabling...' : 'Disable'}
        </button>
      </div>
    )
  }

  // Not subscribed - show enable button
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <NotificationIcon enabled={false} />
      <span className="text-sm">Enable notifications</span>
      <button
        onClick={handleEnable}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs px-3 py-1 rounded-md transition-colors"
      >
        {loading ? 'Enabling...' : 'Enable'}
      </button>
      
      {error && (
        <div className="text-xs text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  )
}
