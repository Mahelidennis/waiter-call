import { NextResponse } from 'next/server'

/**
 * Test current VAPID configuration without changing anything
 */
export async function GET() {
  const pushEnabled = process.env.PUSH_ENABLED === 'true'
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  console.log('🔔 VAPID CHECK: Current configuration', {
    PUSH_ENABLED: pushEnabled,
    VAPID_PUBLIC_KEY: vapidPublicKey ? `Present (${vapidPublicKey.length} chars)` : 'Missing',
    VAPID_PRIVATE_KEY: vapidPrivateKey ? `Present (${vapidPrivateKey.length} chars)` : 'Missing',
    NEXT_PUBLIC_APP_URL: appUrl || 'Missing'
  })

  const issues = []
  
  if (!pushEnabled) {
    issues.push('❌ PUSH_ENABLED is not set to "true"')
  }
  
  if (!vapidPublicKey) {
    issues.push('❌ VAPID_PUBLIC_KEY is missing')
  } else {
    // Check if it looks like a valid VAPID public key
    if (!vapidPublicKey.startsWith('B')) {
      issues.push('⚠️ VAPID_PUBLIC_KEY should start with "B"')
    }
    if (vapidPublicKey.length < 50) {
      issues.push('⚠️ VAPID_PUBLIC_KEY seems too short')
    }
  }
  
  if (!vapidPrivateKey) {
    issues.push('❌ VAPID_PRIVATE_KEY is missing')
  } else {
    if (vapidPrivateKey.length < 30) {
      issues.push('⚠️ VAPID_PRIVATE_KEY seems too short')
    }
  }
  
  if (!appUrl) {
    issues.push('❌ NEXT_PUBLIC_APP_URL is missing')
  }

  const isConfigured = issues.length === 0

  // Test web-push initialization
  let webPushTest = 'Not tested'
  if (isConfigured) {
    try {
      const webpush = require('web-push')
      webpush.setVapidDetails(
        `mailto:admin@${appUrl}`,
        vapidPublicKey,
        vapidPrivateKey
      )
      webPushTest = '✅ Initialized successfully'
    } catch (error) {
      webPushTest = `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      issues.push(`Web-push initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return NextResponse.json({
    status: isConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED',
    issues,
    webPushTest,
    currentConfig: {
      PUSH_ENABLED: pushEnabled,
      VAPID_PUBLIC_KEY: vapidPublicKey ? {
        present: true,
        length: vapidPublicKey.length,
        startsWithB: vapidPublicKey.startsWith('B'),
        preview: vapidPublicKey.substring(0, 20) + '...'
      } : { present: false },
      VAPID_PRIVATE_KEY: vapidPrivateKey ? {
        present: true,
        length: vapidPrivateKey.length,
        preview: vapidPrivateKey.substring(0, 10) + '...'
      } : { present: false },
      NEXT_PUBLIC_APP_URL: appUrl || null
    },
    recommendation: isConfigured ? 
      '✅ Your VAPID keys look good! The issue might be elsewhere.' :
      '❌ Fix the issues above and redeploy.'
  })
}
