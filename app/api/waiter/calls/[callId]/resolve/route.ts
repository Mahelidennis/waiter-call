import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

// Complete a request (only by acknowledging waiter)
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
      
      // Verify call is acknowledged by this waiter (ACKNOWLEDGED or IN_PROGRESS)
      if (!['ACKNOWLEDGED', 'IN_PROGRESS'].includes(call.status) || call.waiterId !== waiter.id) {
        throw new Error('Call cannot be completed - not acknowledged by you or already completed')
      }
      
      // Calculate total service time in milliseconds
      const serviceTimeMs = Math.floor(Date.now() - call.requestedAt.getTime())
      
      // Atomic update: complete the call
      const updatedCall = await tx.call.update({
        where: { id: callId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          responseTime: serviceTimeMs, // Total service time
          // Update legacy fields for backward compatibility
          handledAt: new Date(),
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
    console.error('Error completing call:', error)
    
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INACTIVE_WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized') || error.message.includes('cannot be completed')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Failed to complete call' },
      { status: 500 }
    )
  }
}
