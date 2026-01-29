/**
 * PWA Registration Utility
 * Handles service worker registration and install prompts
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private isInstallable = false
  private isInstalled = false

  constructor() {
    this.checkIfInstalled()
    this.setupInstallPromptListener()
  }

  /**
   * Register the service worker
   */
  async registerServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('PWA: Service Worker not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('PWA: Service Worker registered successfully:', registration.scope)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('PWA: New service worker available')
              // Notify user about update (optional)
              this.notifyUpdateAvailable()
            }
          })
        }
      })

      return true
    } catch (error) {
      console.error('PWA: Service Worker registration failed:', error)
      return false
    }
  }

  /**
   * Check if app is already installed
   */
  private checkIfInstalled(): void {
    if (typeof window === 'undefined') return

    // Check if running in standalone mode
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches
    
    // Also check for iOS standalone mode
    if (!this.isInstalled) {
      this.isInstalled = ('standalone' in window.navigator) && (window.navigator as any).standalone
    }

    console.log('PWA: App installed status:', this.isInstalled)
  }

  /**
   * Setup install prompt listener
   */
  private setupInstallPromptListener(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault()
      
      this.deferredPrompt = event as BeforeInstallPromptEvent
      this.isInstallable = true
      
      console.log('PWA: Install prompt ready')
    })

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true
      this.isInstallable = false
      this.deferredPrompt = null
      
      console.log('PWA: App was installed')
    })
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return this.isInstallable && !this.isInstalled
  }

  /**
   * Check if app is installed
   */
  isAppInstalled(): boolean {
    return this.isInstalled
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA: Install prompt not available')
      return false
    }

    try {
      console.log('PWA: Showing install prompt')
      await this.deferredPrompt.prompt()
      
      const { outcome } = await this.deferredPrompt.userChoice
      
      console.log('PWA: Install prompt outcome:', outcome)
      
      this.deferredPrompt = null
      this.isInstallable = false
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('PWA: Install prompt failed:', error)
      return false
    }
  }

  /**
   * Notify about update availability
   */
  private notifyUpdateAvailable(): void {
    // Simple notification - can be enhanced with UI
    console.log('PWA: Update available. Refresh to get latest version.')
    
    // You could dispatch a custom event here
    window.dispatchEvent(new CustomEvent('pwa-update-available'))
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        console.log('PWA: Checked for updates')
        return true
      }
    } catch (error) {
      console.error('PWA: Update check failed:', error)
    }
    
    return false
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'online' | 'offline' {
    if (typeof window === 'undefined') return 'online'
    return navigator.onLine ? 'online' : 'offline'
  }

  /**
   * Setup connection status listeners
   */
  onConnectionChange(callback: (status: 'online' | 'offline') => void): () => void {
    if (typeof window === 'undefined') return () => {}

    const handleOnline = () => callback('online')
    const handleOffline = () => callback('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

// Singleton instance
let pwaManager: PWAManager | null = null

/**
 * Get or create the PWA manager singleton
 */
export function getPWAManager(): PWAManager {
  if (!pwaManager) {
    pwaManager = new PWAManager()
  }
  return pwaManager
}

/**
 * Initialize PWA functionality
 */
export async function initializePWA(): Promise<PWAManager> {
  const manager = getPWAManager()
  await manager.registerServiceWorker()
  return manager
}
