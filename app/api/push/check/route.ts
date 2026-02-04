import { NextResponse } from 'next/server'

/**
 * Quick check for push notification configuration
 * This endpoint helps verify if VAPID keys are properly set
 */
export async function GET() {
  const pushEnabled = process.env.PUSH_ENABLED === 'true'
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const issues = []
  
  if (!pushEnabled) {
    issues.push('PUSH_ENABLED is not set to "true"')
  }
  
  if (!vapidPublicKey) {
    issues.push('VAPID_PUBLIC_KEY is missing')
  } else if (vapidPublicKey.length < 50) {
    issues.push('VAPID_PUBLIC_KEY appears to be too short (invalid)')
  }
  
  if (!vapidPrivateKey) {
    issues.push('VAPID_PRIVATE_KEY is missing')
  } else if (vapidPrivateKey.length < 30) {
    issues.push('VAPID_PRIVATE_KEY appears to be too short (invalid)')
  }
  
  if (!appUrl) {
    issues.push('NEXT_PUBLIC_APP_URL is missing')
  }

  const isConfigured = issues.length === 0

  return NextResponse.json({
    status: isConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED',
    issues,
    configuration: {
      PUSH_ENABLED: pushEnabled,
      VAPID_PUBLIC_KEY: vapidPublicKey ? `✅ Present (${vapidPublicKey.length} chars)` : '❌ Missing',
      VAPID_PRIVATE_KEY: vapidPrivateKey ? `✅ Present (${vapidPrivateKey.length} chars)` : '❌ Missing',
      NEXT_PUBLIC_APP_URL: appUrl || '❌ Missing'
    },
    nextSteps: isConfigured ? [
      '✅ Push notifications should work now',
      '📱 Test by enabling notifications in waiter dashboard',
      '🔔 Try calling a waiter to test push delivery'
    ] : [
      '🔑 Generate VAPID keys: node scripts/generate-vapid-keys.js',
      '⚙️ Add environment variables in Vercel dashboard',
      '🔄 Redeploy the application',
      '📱 Test push notifications in waiter dashboard'
    ]
  })
}
