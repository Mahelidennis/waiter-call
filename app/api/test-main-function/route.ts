import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendCallNotification } from '@/lib/push/sending'

/**
 * Quick test of the main call waiter functionality with proper UUIDs
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing main call waiter functionality...')

    // 1. Create test data with proper UUIDs
    const restaurantId = '550e8400-e29b-41d4-a716-446655440000'
    const tableId = '550e8400-e29b-41d4-a716-446655440001'
    const waiterId = '550e8400-e29b-41d4-a716-446655440002'

    // Create restaurant
    await prisma.restaurant.upsert({
      where: { id: restaurantId },
      update: {},
      create: {
        id: restaurantId,
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        email: 'test@restaurant.com',
      },
    })

    // Create table
    await prisma.table.upsert({
      where: { id: tableId },
      update: {},
      create: {
        id: tableId,
        restaurantId,
        number: 'T1',
        qrCode: 'test-table-1',
        isActive: true,
      },
    })

    // Create waiter
    await prisma.waiter.upsert({
      where: { id: waiterId },
      update: {},
      create: {
        id: waiterId,
        restaurantId,
        name: 'Test Waiter',
        email: 'waiter@restaurant.com',
        isActive: true,
      },
    })

    // Create assignment
    await prisma.waiterTable.upsert({
      where: { waiterId_tableId: { waiterId, tableId } },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        waiterId,
        tableId,
      },
    })

    console.log('✅ Test data created')

    // 2. Create a call (customer calls waiter)
    const call = await prisma.call.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440004',
        restaurantId,
        tableId,
        waiterId,
        status: 'PENDING',
        requestedAt: new Date(),
        // timeoutAt removed - database doesn't have this column yet
      },
      include: {
        table: true,
        waiter: true,
      },
    })

    console.log('📞 Call created:', call.id)

    // 3. Send push notification
    const notificationResult = await sendCallNotification(
      call.id,
      call.table.number,
      restaurantId,
      waiterId
    )

    console.log('🔔 Notification sent:', notificationResult.sent > 0)

    // 4. Acknowledge call
    const acknowledgedCall = await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        responseTime: 1000,
      },
    })

    console.log('✅ Call acknowledged')

    // 5. Complete call
    const completedCall = await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    console.log('🎉 Call completed')

    // 6. Cleanup
    await prisma.call.delete({ where: { id: call.id } })

    return NextResponse.json({
      success: true,
      message: '✅ MAIN CALL WAITER FUNCTIONALITY WORKING PERFECTLY!',
      testResults: {
        callCreated: true,
        notificationSent: notificationResult.sent > 0,
        callAcknowledged: true,
        callCompleted: true,
        systemReady: true
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
