import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Debug endpoint to see existing calls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const tableId = searchParams.get('tableId')
    
    console.log('Debug calls - restaurantId:', restaurantId, 'tableId:', tableId)
    
    let whereClause: any = {}
    if (restaurantId) whereClause.restaurantId = restaurantId
    if (tableId) whereClause.tableId = tableId
    
    const calls = await prisma.call.findMany({
      where: whereClause,
      include: {
        table: true,
        waiter: true,
        restaurant: true
      },
      orderBy: {
        requestedAt: 'desc'
      },
      take: 10
    })
    
    console.log('Found calls:', calls.length)
    
    return NextResponse.json({
      success: true,
      calls: calls.map(call => ({
        id: call.id,
        status: call.status,
        requestedAt: call.requestedAt,
        tableId: call.tableId,
        tableName: call.table?.number,
        tableQrCode: call.table?.qrCode,
        restaurantId: call.restaurantId,
        restaurantName: call.restaurant?.name,
        waiterId: call.waiterId,
        waiterName: call.waiter?.name,
        timeoutAt: call.timeoutAt,
        acknowledgedAt: call.acknowledgedAt,
        completedAt: call.completedAt,
        missedAt: call.missedAt
      }))
    })
    
  } catch (error) {
    console.error('Debug calls error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to debug calls',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
