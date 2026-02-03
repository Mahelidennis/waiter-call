import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendCallNotification } from '@/lib/push/sending'

/**
 * Test the complete call waiter flow
 * This endpoint tests the main functionality: customer calls waiter → waiter gets notified → waiter acknowledges
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting complete call waiter flow test...')

    // 1. Setup test data (or use existing)
    const restaurant = await prisma.restaurant.findFirst()
    if (!restaurant) {
      return NextResponse.json({ error: 'No restaurant found' }, { status: 404 })
    }

    console.log('📱 Found restaurant:', restaurant.name)

    // 2. Get a table with assigned waiter
    const waiterTable = await prisma.waiterTable.findFirst({
      include: {
        waiter: true,
        table: true
      }
    })

    if (!waiterTable) {
      return NextResponse.json({ error: 'No waiter-table assignments found' }, { status: 404 })
    }

    console.log('👥 Found assignment:', {
      table: waiterTable.table.number,
      waiter: waiterTable.waiter.name
    })

    // 3. Create a call (customer calls waiter)
    // First check if there are existing calls to clean up
    await prisma.call.deleteMany({
      where: { restaurantId: restaurant.id }
    })

    const call = await prisma.call.create({
      data: {
        id: `test-call-${Date.now()}`, // Unique ID
        restaurantId: restaurant.id,
        tableId: waiterTable.tableId,
        waiterId: waiterTable.waiterId,
        status: 'PENDING',
        requestedAt: new Date(),
        // timeoutAt removed - database doesn't have this column yet
      },
      include: {
        table: true,
        waiter: true
      }
    })

    console.log('📞 Call created:', {
      callId: call.id,
      table: call.table.number,
      waiter: call.waiter?.name || 'unassigned'
    })

    // 4. Send push notification to waiter
    const notificationResult = await sendCallNotification(
      call.id,
      call.table.number,
      restaurant.id,
      call.waiterId
    )

    console.log('🔔 Push notification result:', {
      success: notificationResult.success,
      sent: notificationResult.sent,
      failed: notificationResult.failed
    })

    // 5. Simulate waiter acknowledging the call
    const acknowledgedCall = await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'ACKNOWLEDGED',
        // acknowledgedAt removed - database doesn't have this column yet
        responseTime: Math.floor(Date.now() - call.requestedAt.getTime())
      },
      include: {
        table: true,
        waiter: true
      }
    })

    console.log('✅ Call acknowledged:', {
      callId: acknowledgedCall.id,
      status: acknowledgedCall.status,
      responseTime: acknowledgedCall.responseTime
    })

    // 6. Complete the call
    const completedCall = await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'COMPLETED',
        // completedAt removed - database doesn't have this column yet
      },
      include: {
        table: true,
        waiter: true
      }
    })

    console.log('🎉 Call completed:', {
      callId: completedCall.id,
      finalStatus: completedCall.status
    })

    // 7. Cleanup test call
    await prisma.call.delete({
      where: { id: call.id }
    })

    console.log('🧹 Test call cleaned up')

    return NextResponse.json({
      success: true,
      message: 'Complete call waiter flow test successful',
      testResults: {
        restaurant: restaurant.name,
        table: waiterTable.table.number,
        waiter: waiterTable.waiter.name,
        callCreated: true,
        notificationSent: notificationResult.sent > 0,
        callAcknowledged: true,
        callCompleted: true,
        responseTime: acknowledgedCall.responseTime
      }
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
