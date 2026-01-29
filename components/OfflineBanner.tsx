'use client'

import { useState, useEffect } from 'react'
import { getPWAManager } from '@/lib/pwa/registration'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)
  const pwaManager = getPWAManager()

  useEffect(() => {
    // Initial status
    setIsOnline(pwaManager.getConnectionStatus() === 'online')

    // Listen for connection changes
    const unsubscribe = pwaManager.onConnectionChange((status) => {
      const online = status === 'online'
      setIsOnline(online)
      
      // Show banner when going offline
      if (!online) {
        setShowBanner(true)
      }
    })

    return unsubscribe
  }, [pwaManager])

  const handleDismiss = () => {
    setShowBanner(false)
  }

  // Only show when offline and banner hasn't been dismissed
  if (isOnline || !showBanner) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl">
                wifi_off
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                You're offline
              </h3>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Some features may not work until you reconnect
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 p-1"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>
    </div>
  )
}
