import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Check if waiters have push subscriptions
 * This helps diagnose why notifications aren't working
 */
export async function GET() {
  console.log('🔍 SUBSCRIPTION CHECK: Starting subscription audit')
  
  try {
    // Get all active waiters
    const activeWaiters = await prisma.waiter.findMany({
      where: { isActive: true },
      include: {
        restaurant: true,
        pushSubscriptions: true
      }
    })

    console.log('🔍 SUBSCRIPTION CHECK: Found active waiters', activeWaiters.length)

    const waiterSubscriptionStatus = activeWaiters.map(waiter => ({
      waiterId: waiter.id,
      waiterName: waiter.name,
      restaurantId: waiter.restaurantId,
      subscriptionCount: waiter.pushSubscriptions?.length || 0,
      subscriptions: waiter.pushSubscriptions?.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        createdAt: sub.createdAt,
        lastUsedAt: sub.lastUsedAt
      })) || []
    }))

    // Count total subscriptions
    const totalSubscriptions = activeWaiters.reduce((sum, waiter) => 
      sum + (waiter.pushSubscriptions?.length || 0), 0)

    console.log('🔍 SUBSCRIPTION CHECK: Subscription summary', {
      totalWaiters: activeWaiters.length,
      totalSubscriptions,
      waitersWithSubscriptions: waiterSubscriptionStatus.filter(w => w.subscriptionCount > 0).length
    })

    return NextResponse.json({
      success: true,
      summary: {
        totalWaiters: activeWaiters.length,
        totalSubscriptions,
        waitersWithSubscriptions: waiterSubscriptionStatus.filter(w => w.subscriptionCount > 0).length
      },
      waiters: waiterSubscriptionStatus,
      recommendations: totalSubscriptions === 0 ? [
        '❌ No push subscriptions found',
        '📱 Waiters need to enable notifications in dashboard',
        '🔔 Check PushToggle component in waiter dashboard'
      ] : waiterSubscriptionStatus.some(w => w.subscriptionCount === 0) ? [
        '⚠️ Some waiters have no subscriptions',
        '📱 Those waiters need to enable notifications'
      ] : [
        '✅ Waiters have push subscriptions',
        '🧪 Test with POST /api/push/test-complete'
      ]
    })

  } catch (error) {
    console.error('🔍 SUBSCRIPTION CHECK: Error', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
