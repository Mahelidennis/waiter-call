import { NextRequest, NextResponse } from 'next/server'
import { requireWaiterSession } from '@/lib/auth/waiterSession'
import { testPushNotification } from '@/lib/push/sending'

/**
 * POST /api/push/test
 * 
 * Test push notification functionality (development only).
 * Sends a test push notification to the authenticated waiter.
 * 
 * Security:
 * - Requires authenticated waiter session
 * - Development environment only
 * - Uses test call data
 */
export async function POST(request: NextRequest) {
  // Development only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    // Authenticate waiter
    const waiter = await requireWaiterSession()

    // Send test push notification
    const result = await testPushNotification(waiter.id)

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Test push notification sent successfully' 
        : 'Test push notification failed',
      details: {
        sent: result.sent,
        failed: result.failed,
        invalidSubscriptions: result.invalidSubscriptions.length,
        errors: result.errors.length
      }
    })

  } catch (error) {
    console.error('Test push notification error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test push notification' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/push/test
 * 
 * Check if test push notifications are available.
 */
export async function GET() {
  return NextResponse.json({
    available: process.env.NODE_ENV !== 'production',
    environment: process.env.NODE_ENV,
    message: process.env.NODE_ENV === 'production' 
      ? 'Test push notifications not available in production'
      : 'Test push notifications available'
  })
}
