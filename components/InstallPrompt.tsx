'use client'

import { useState, useEffect } from 'react'
import { getPWAManager } from '@/lib/pwa/registration'

export default function InstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const pwaManager = getPWAManager()

  useEffect(() => {
    // Check install status
    setCanInstall(pwaManager.canInstall())
    setIsInstalled(pwaManager.isAppInstalled())

    // Listen for install prompt availability
    const checkInstallStatus = () => {
      setCanInstall(pwaManager.canInstall())
      setIsInstalled(pwaManager.isAppInstalled())
    }

    const interval = setInterval(checkInstallStatus, 1000)

    return () => clearInterval(interval)
  }, [pwaManager])

  const handleInstall = async () => {
    if (!canInstall || isInstalling) return

    setIsInstalling(true)
    
    try {
      const installed = await pwaManager.showInstallPrompt()
      
      if (installed) {
        setIsInstalled(true)
        setCanInstall(false)
      }
    } catch (error) {
      console.error('Install failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store dismissal in localStorage for this session
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if:
  // - Already installed
  // - Can't install
  // - User dismissed it
  // - Currently installing
  if (isInstalled || !canInstall || dismissed || isInstalling) {
    return null
  }

  // Check if user has dismissed in this session
  if (typeof window !== 'undefined' && localStorage.getItem('pwa-install-dismissed')) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm sm:left-auto sm:right-4 sm:max-w-xs">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">
                download
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Install Waiter Call
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Get instant access and a native app experience
            </p>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </button>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
                title="Not now"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
