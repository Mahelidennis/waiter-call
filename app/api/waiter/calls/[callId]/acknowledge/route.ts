import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

// Acknowledge a request (atomic operation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    // Authenticate and get waiter info
    const waiter = await requireWaiterSession()
    const { callId } = await params
    
    // Start transaction for atomic update
    const result = await prisma.$transaction(async (tx) => {
      // Get the call and verify waiter can access it
      const call = await tx.call.findUnique({
        where: { id: callId },
        include: {
          table: true
        }
      })
      
      if (!call) {
        throw new Error('Call not found')
      }
      
      // Verify call belongs to waiter's restaurant
      if (call.restaurantId !== waiter.restaurantId) {
        throw new Error('Unauthorized: Call not from your restaurant')
      }
      
      // Verify waiter is assigned to this table
      const waiterTable = await tx.waiterTable.findFirst({
        where: {
          waiterId: waiter.id,
          tableId: call.tableId
        }
      })
      
      if (!waiterTable) {
        throw new Error('Unauthorized: You are not assigned to this table')
      }
      
      // Verify call is in PENDING state and not already acknowledged
      // Allow acknowledgment of MISSED calls for recovery
      if (!['PENDING', 'MISSED'].includes(call.status)) {
        throw new Error('Call cannot be acknowledged - not in PENDING or MISSED state')
      }
      
      // Calculate response time in milliseconds
      const responseTimeMs = Math.floor(Date.now() - call.requestedAt.getTime())
      
      // Atomic update: acknowledge the call
      const updatedCall = await tx.call.update({
        where: { id: callId },
        data: {
          status: 'ACKNOWLEDGED',
          waiterId: waiter.id,
          acknowledgedAt: new Date(),
          responseTime: responseTimeMs,
          // Clear missedAt if this was a missed call being recovered
          missedAt: call.status === 'MISSED' ? null : call.missedAt,
          // Update legacy field for backward compatibility
          handledAt: null, // Not handled yet, just acknowledged
        },
        include: {
          table: {
            select: {
              id: true,
              number: true
            }
          },
          waiter: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      
      return updatedCall
    })
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error acknowledging call:', error)
    
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INACTIVE_WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized') || error.message.includes('cannot be acknowledged')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Failed to acknowledge call' },
      { status: 500 }
    )
  }
}
