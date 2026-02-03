import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, requireWaiter, getAuthenticatedUser } from '@/lib/auth/server'
import { CallStatus, normalizeStatus, isValidStatusTransition } from '@/lib/constants/callStatus'

// Update call status (mark as handled)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const body = await request.json()
    const { status, waiterId } = body

    // Authorization: Require authenticated user
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      console.error('Unauthorized call update attempt - no authentication')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the call first to verify ownership
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        table: true,
        waiter: true,
      },
    })

    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this restaurant
    if (authUser.restaurantId !== call.restaurantId) {
      console.error('Call update denied - wrong restaurant:', { 
        userRestaurantId: authUser.restaurantId, 
        callRestaurantId: call.restaurantId,
        userId: authUser.user.id,
        role: authUser.role,
        callId
      })
      return NextResponse.json(
        { error: 'Unauthorized - restaurant access denied' },
        { status: 403 }
      )
    }

    // Role-based permissions
    if (authUser.role === 'admin') {
      // Admin can update any call in their restaurant
      console.log('Admin updating call:', { 
        adminId: authUser.user.id, 
        callId, 
        newStatus: status 
      })
    } else if (authUser.role === 'waiter') {
      // Waiter can only update calls assigned to them or calls in their restaurant
      if (call.waiterId && call.waiterId !== authUser.waiterId) {
        console.error('Waiter update denied - not assigned to call:', { 
          waiterId: authUser.waiterId, 
          assignedWaiterId: call.waiterId,
          callId
        })
        return NextResponse.json(
          { error: 'Unauthorized - call not assigned to you' },
          { status: 403 }
        )
      }
      
      // Validate status transition for waiters
      if (status && !isValidStatusTransition(call.status, status, 'waiter')) {
        console.error('Waiter update denied - invalid status transition:', { 
          currentStatus: call.status, 
          newStatus: status,
          waiterId: authUser.waiterId,
          callId
        })
        return NextResponse.json(
          { error: 'Unauthorized - invalid status transition' },
          { status: 403 }
        )
      }
      
      console.log('Waiter updating call:', { 
        waiterId: authUser.waiterId, 
        callId, 
        newStatus: status 
      })
    } else {
      console.error('Unknown role attempting call update:', { role: authUser.role, userId: authUser.user.id })
      return NextResponse.json(
        { error: 'Unauthorized - invalid role' },
        { status: 403 }
      )
    }

    // Normalize the status to handle legacy values
    const normalizedStatus = status ? normalizeStatus(status) : call.status

    // Calculate response time if marking as completed
    let responseTime = null
    let handledAt = null
    
    if (normalizedStatus === CallStatus.COMPLETED && call.status === CallStatus.PENDING) {
      const diff = Date.now() - call.requestedAt.getTime()
      responseTime = Math.floor(diff) // in milliseconds
      // completedAt removed - database doesn't have this column yet
      handledAt = new Date() // For backward compatibility
    } else if (normalizedStatus === CallStatus.COMPLETED) {
      // completedAt removed - database doesn't have this column yet
      handledAt = new Date() // For backward compatibility
    }

    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: normalizedStatus,
        waiterId: waiterId || call.waiterId,
        // completedAt removed - database doesn't have this column yet
        handledAt: handledAt || call.handledAt,
        responseTime: responseTime || call.responseTime,
      },
      include: {
        table: true,
        waiter: true,
      },
    })

    // Return standardized response
    const standardizedResponse = {
      ...updatedCall,
      normalizedStatus: normalizeStatus(updatedCall.status),
      isActive: [CallStatus.PENDING, CallStatus.ACKNOWLEDGED, CallStatus.IN_PROGRESS].includes(normalizeStatus(updatedCall.status) as CallStatus),
      isTerminal: [CallStatus.COMPLETED, CallStatus.MISSED, CallStatus.CANCELLED, CallStatus.HANDLED].includes(normalizeStatus(updatedCall.status) as CallStatus)
    }

    return NextResponse.json(updatedCall)
  } catch (error: any) {
    console.error('Error updating call:', error)
    
    // Handle authorization errors specifically
    if (error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (error.message === 'UNAUTHORIZED' || error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: 'Failed to update call' },
      { status: 500 }
    )
  }
}

