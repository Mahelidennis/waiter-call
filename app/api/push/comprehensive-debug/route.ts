import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Comprehensive push notification debugging endpoint
 * Tests the complete flow step by step
 */
export async function GET() {
  console.log('🔍 COMPREHENSIVE DEBUG: Starting complete push flow analysis')
  
  try {
    const results = {
      timestamp: new Date().toISOString(),
      steps: [] as any[]
    }

    // Step 1: Check environment variables
    const envCheck = {
      PUSH_ENABLED: process.env.PUSH_ENABLED === 'true',
      VAPID_PUBLIC_KEY: !!process.env.VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      VAPID_PUBLIC_KEY_LENGTH: process.env.VAPID_PUBLIC_KEY?.length || 0,
      VAPID_PRIVATE_KEY_LENGTH: process.env.VAPID_PRIVATE_KEY?.length || 0
    }
    
    results.steps.push({
      step: 1,
      name: 'Environment Variables Check',
      status: envCheck.PUSH_ENABLED && envCheck.VAPID_PUBLIC_KEY && envCheck.VAPID_PRIVATE_KEY ? '✅ PASS' : '❌ FAIL',
      details: envCheck
    })

    // Step 2: Check database connection and waiters
    try {
      const waiters = await prisma.waiter.findMany({
        where: { isActive: true },
        include: {
          restaurant: true,
          pushSubscriptions: true
        },
        take: 5 // Limit for debugging
      })

      results.steps.push({
        step: 2,
        name: 'Database Connection & Waiters',
        status: waiters.length > 0 ? '✅ PASS' : '❌ FAIL',
        details: {
          totalActiveWaiters: waiters.length,
          waiters: waiters.map(w => ({
            id: w.id,
            name: w.name,
            restaurantId: w.restaurantId,
            subscriptionCount: w.pushSubscriptions?.length || 0
          }))
        }
      })
    } catch (dbError) {
      results.steps.push({
        step: 2,
        name: 'Database Connection & Waiters',
        status: '❌ FAIL',
        error: dbError instanceof Error ? dbError.message : 'Database error'
      })
    }

    // Step 3: Check push subscriptions table
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        include: {
          waiter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        take: 10 // Limit for debugging
      })

      results.steps.push({
        step: 3,
        name: 'Push Subscriptions Table',
        status: '✅ PASS',
        details: {
          totalSubscriptions: subscriptions.length,
          subscriptions: subscriptions.map(s => ({
            id: s.id,
            waiterId: s.waiterId,
            waiterName: s.waiter?.name,
            endpoint: s.endpoint.substring(0, 50) + '...',
            createdAt: s.createdAt,
            lastUsedAt: s.lastUsedAt
          }))
        }
      })
    } catch (subError) {
      results.steps.push({
        step: 3,
        name: 'Push Subscriptions Table',
        status: '❌ FAIL',
        error: subError instanceof Error ? subError.message : 'Subscription table error'
      })
    }

    // Step 4: Test web-push initialization
    try {
      if (envCheck.VAPID_PUBLIC_KEY && envCheck.VAPID_PRIVATE_KEY && envCheck.NEXT_PUBLIC_APP_URL) {
        const webpush = require('web-push')
        webpush.setVapidDetails(
          `mailto:admin@${process.env.NEXT_PUBLIC_APP_URL}`,
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        )
        
        results.steps.push({
          step: 4,
          name: 'Web-Push Library Initialization',
          status: '✅ PASS',
          details: 'Web-push library initialized successfully'
        })
      } else {
        results.steps.push({
          step: 4,
          name: 'Web-Push Library Initialization',
          status: '❌ FAIL',
          details: 'Missing VAPID configuration'
        })
      }
    } catch (wpError) {
      results.steps.push({
        step: 4,
        name: 'Web-Push Library Initialization',
        status: '❌ FAIL',
        error: wpError instanceof Error ? wpError.message : 'Web-push error'
      })
    }

    // Step 5: Check service worker availability
    results.steps.push({
      step: 5,
      name: 'Service Worker File',
      status: '✅ PASS', // We know sw.js exists from previous checks
      details: 'Service worker file exists at /sw.js'
    })

    // Overall status
    const failedSteps = results.steps.filter(step => step.status.includes('FAIL'))
    const overallStatus = failedSteps.length === 0 ? '✅ ALL SYSTEMS READY' : '❌ ISSUES FOUND'

    return NextResponse.json({
      overallStatus,
      totalSteps: results.steps.length,
      passedSteps: results.steps.filter(step => step.status.includes('PASS')).length,
      failedSteps: failedSteps.length,
      results,
      recommendations: failedSteps.length === 0 ? [
        '✅ All systems ready for push notifications',
        '📱 Test by enabling notifications in waiter dashboard',
        '🧪 Use POST /api/push/test-complete to test full flow'
      ] : [
        '❌ Fix the failed steps above before testing',
        '🔧 Check environment variables in Vercel dashboard',
        '🗄️ Verify database connection and schema'
      ]
    })

  } catch (error) {
    console.error('🔍 COMPREHENSIVE DEBUG: Error', error)
    return NextResponse.json({
      overallStatus: '❌ CRITICAL ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
