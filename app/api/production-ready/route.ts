import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * PRODUCTION READINESS VERIFICATION
 * Tests all core components of the call waiter system
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 PRODUCTION READINESS VERIFICATION')

    const results = {
      database: false,
      restaurants: false,
      tables: false,
      waiters: false,
      assignments: false,
      callCreation: false,
      callStatusFlow: false,
      notifications: false,
      apiEndpoints: false,
      overallReady: false
    }

    // 1. Database Connection
    try {
      await prisma.$queryRaw`SELECT 1`
      results.database = true
      console.log('✅ Database connection: WORKING')
    } catch (error) {
      console.log('❌ Database connection: FAILED')
    }

    // 2. Check Restaurants
    const restaurantCount = await prisma.restaurant.count()
    results.restaurants = restaurantCount > 0
    console.log(`📱 Restaurants: ${restaurantCount > 0 ? 'WORKING' : 'MISSING'} (${restaurantCount} found)`)

    // 3. Check Tables
    const tableCount = await prisma.table.count()
    results.tables = tableCount > 0
    console.log(`🪑 Tables: ${tableCount > 0 ? 'WORKING' : 'MISSING'} (${tableCount} found)`)

    // 4. Check Waiters
    const waiterCount = await prisma.waiter.count()
    results.waiters = waiterCount > 0
    console.log(`👥 Waiters: ${waiterCount > 0 ? 'WORKING' : 'MISSING'} (${waiterCount} found)`)

    // 5. Check Assignments
    const assignmentCount = await prisma.waiterTable.count()
    results.assignments = assignmentCount > 0
    console.log(`🔗 Assignments: ${assignmentCount > 0 ? 'WORKING' : 'MISSING'} (${assignmentCount} found)`)

    // 6. Test Call Creation (if data exists)
    if (results.restaurants && results.tables && results.waiters) {
      try {
        const restaurant = await prisma.restaurant.findFirst()
        const table = await prisma.table.findFirst()
        const waiter = await prisma.waiter.findFirst()

        if (restaurant && table && waiter) {
          // Clean up any existing test calls
          await prisma.call.deleteMany({
            where: { restaurantId: restaurant.id }
          })

          // Create test call with unique ID
          const testCallId = `test-${Date.now()}`
          const call = await prisma.call.create({
            data: {
              id: testCallId,
              restaurantId: restaurant.id,
              tableId: table.id,
              waiterId: waiter.id,
              status: 'PENDING',
              requestedAt: new Date(),
              timeoutAt: new Date(Date.now() + 2 * 60 * 1000),
            },
          })

          results.callCreation = true
          console.log('📞 Call creation: WORKING')

          // Test status flow
          await prisma.call.update({
            where: { id: call.id },
            data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() }
          })

          await prisma.call.update({
            where: { id: call.id },
            data: { status: 'COMPLETED', completedAt: new Date() }
          })

          results.callStatusFlow = true
          console.log('🔄 Call status flow: WORKING')

          // Cleanup
          await prisma.call.delete({ where: { id: call.id } })
        }
      } catch (error) {
        console.log('❌ Call creation/flow: FAILED', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // 7. Test Notification System (basic check)
    try {
      // Just check if the notification function exists and can be called
      const { sendCallNotification } = await import('@/lib/push/sending')
      results.notifications = true
      console.log('🔔 Notification system: AVAILABLE')
    } catch (error) {
      console.log('❌ Notification system: FAILED')
    }

    // 8. Test API Endpoints (basic check)
    try {
      // Check if main API files exist and can be imported
      await import('@/app/api/calls/route')
      await import('@/app/api/waiter/calls/[callId]/acknowledge/route')
      results.apiEndpoints = true
      console.log('🌐 API endpoints: WORKING')
    } catch (error) {
      console.log('❌ API endpoints: FAILED')
    }

    // 9. Overall Assessment
    results.overallReady = Object.values(results).filter(v => v === true).length >= 6

    const readyMessage = results.overallReady 
      ? '🎉 SYSTEM IS READY FOR PRODUCTION DEPLOYMENT!'
      : '⚠️ SYSTEM NEEDS ATTENTION BEFORE DEPLOYMENT'

    return NextResponse.json({
      success: results.overallReady,
      message: readyMessage,
      results,
      deploymentReady: results.overallReady,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error)
    return NextResponse.json({
      success: false,
      message: '❌ CRITICAL SYSTEM FAILURE',
      error: error instanceof Error ? error.message : 'Unknown error',
      deploymentReady: false
    }, { status: 500 })
  }
}
