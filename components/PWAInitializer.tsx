'use client'

import { useEffect } from 'react'
import { initializePWA } from '@/lib/pwa/registration'

export default function PWAInitializer() {
  useEffect(() => {
    // Initialize PWA only on the client side
    initializePWA().catch((error) => {
      console.error('PWA initialization failed:', error)
    })
  }, [])

  return null // This component doesn't render anything
}
