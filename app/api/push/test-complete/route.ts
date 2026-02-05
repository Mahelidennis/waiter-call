import { NextResponse } from 'next/server'
import { sendCallNotification } from '@/lib/push/sending'
import { prisma } from '@/lib/db'

/**
 * Test push notification by creating a test call
 * This helps verify the complete push flow
 */
export async function POST() {
  console.log('🧪 PUSH TEST: Starting complete push flow test')
  
  try {
    // Get first active waiter and restaurant
    const waiter = await prisma.waiter.findFirst({
      where: { isActive: true },
      include: { restaurant: true }
    })

    if (!waiter) {
      return NextResponse.json({
        success: false,
        error: 'No active waiters found'
      })
    }

    console.log('🧪 PUSH TEST: Found waiter', {
      waiterId: waiter.id,
      name: waiter.name,
      restaurantId: waiter.restaurantId
    })

    // Get a table for this restaurant
    const table = await prisma.table.findFirst({
      where: { restaurantId: waiter.restaurantId }
    })

    if (!table) {
      return NextResponse.json({
        success: false,
        error: 'No tables found for restaurant'
      })
    }

    console.log('🧪 PUSH TEST: Found table', {
      tableId: table.id,
      number: table.number
    })

    // Create a test call
    const testCall = await prisma.call.create({
      data: {
        restaurantId: waiter.restaurantId, // Add required restaurantId
        tableId: table.id,
        waiterId: waiter.id, // Assign to this waiter
        status: 'PENDING',
        requestedAt: new Date()
      }
    })

    console.log('🧪 PUSH TEST: Created test call', {
      callId: testCall.id,
      tableNumber: table.number,
      waiterId: waiter.id
    })

    // Send push notification for this call
    const pushResult = await sendCallNotification(
      testCall.id,
      table.number,
      waiter.restaurantId,
      waiter.id
    )

    console.log('🧪 PUSH TEST: Push notification result', pushResult)

    // Clean up - delete the test call
    await prisma.call.delete({
      where: { id: testCall.id }
    })

    console.log('🧪 PUSH TEST: Cleaned up test call')

    return NextResponse.json({
      success: true,
      testCall: {
        id: testCall.id,
        tableNumber: table.number,
        waiterId: waiter.id
      },
      pushResult,
      message: 'Test completed successfully. Check if you received a push notification.'
    })

  } catch (error) {
    console.error('🧪 PUSH TEST: Error', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
