import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Update call status (mark as handled)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const body = await request.json()
    const { status, waiterId } = body

    const call = await prisma.call.findUnique({
      where: { id: callId },
    })

    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // Calculate response time if marking as handled
    let responseTime = null
    if (status === 'HANDLED' && call.status === 'PENDING') {
      const diff = Date.now() - call.requestedAt.getTime()
      responseTime = Math.floor(diff / 1000) // in seconds
    }

    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: status || call.status,
        waiterId: waiterId || call.waiterId,
        handledAt: status === 'HANDLED' ? new Date() : call.handledAt,
        responseTime: responseTime || call.responseTime,
      },
      include: {
        table: true,
        waiter: true,
      },
    })

    return NextResponse.json(updatedCall)
  } catch (error) {
    console.error('Error updating call:', error)
    return NextResponse.json(
      { error: 'Failed to update call' },
      { status: 500 }
    )
  }
}

