import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Fix timeout issues by manually updating timed-out calls
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, tableId } = body
    
    console.log('Fixing timeout for:', { restaurantId, tableId })
    
    const now = new Date()
    
    // Find all PENDING calls that should have timed out
    const timedOutCalls = await prisma.call.findMany({
      where: {
        ...(restaurantId && { restaurantId }),
        ...(tableId && { tableId }),
        status: 'PENDING',
        // timeoutAt removed - database doesn't have this column yet
      },
    })
    
    console.log('Found timed-out calls:', timedOutCalls.length)
    
    // Mark each timed-out call as MISSED
    const updatedCalls = []
    for (const call of timedOutCalls) {
      const updated = await prisma.call.update({
        where: { id: call.id },
        data: {
          status: 'MISSED',
          // missedAt removed - database doesn't have this column yet
          // Calculate response time for analytics
          responseTime: Math.floor(now.getTime() - call.requestedAt.getTime()),
        },
        include: {
          table: true,
          waiter: true,
        },
      })
      updatedCalls.push(updated)
      console.log(`Updated call ${call.id} to MISSED`)
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCalls.length} timed-out calls`,
      fixedCalls: updatedCalls.map(call => ({
        id: call.id,
        tableName: call.table?.number,
        tableQrCode: call.table?.qrCode,
        status: call.status,
        // missedAt removed - database doesn't have this column yet
        wasPendingFor: Math.floor((now.getTime() - call.requestedAt.getTime()) / 1000 / 60) + ' minutes'
      }))
    })
    
  } catch (error) {
    console.error('Error fixing timeout:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix timeout',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
