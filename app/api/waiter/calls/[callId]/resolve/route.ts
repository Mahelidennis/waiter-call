import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

// Resolve a request (only by acknowledging waiter)
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
      // Get the call
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
      
      // Verify call is acknowledged by this waiter (has waiterId but still PENDING)
      if (call.status !== 'PENDING' || call.waiterId !== waiter.id) {
        throw new Error('Call cannot be resolved - not acknowledged by you or already resolved')
      }
      
      // Calculate response time
      const responseTime = Math.floor((Date.now() - call.requestedAt.getTime()) / 1000)
      
      // Atomic update: resolve the call (set status to HANDLED)
      const updatedCall = await tx.call.update({
        where: { id: callId },
        data: {
          status: 'HANDLED',
          handledAt: new Date(),
          responseTime
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
    console.error('Error resolving call:', error)
    
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INACTIVE_WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized') || error.message.includes('cannot be resolved')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Failed to resolve call' },
      { status: 500 }
    )
  }
}
