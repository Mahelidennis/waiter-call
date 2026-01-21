import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  generateNumericAccessCode,
  hashAccessCode,
} from '@/lib/auth/waiterAccess'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ waiterId: string }> }
) {
  try {
    const { waiterId } = await params

    const waiter = await prisma.waiter.findUnique({
      where: { id: waiterId },
      select: { id: true, isActive: true, name: true },
    })

    if (!waiter) {
      return NextResponse.json(
        { error: 'Waiter not found' },
        { status: 404 }
      )
    }

    if (!waiter.isActive) {
      return NextResponse.json(
        { error: 'Cannot reset code for inactive waiter' },
        { status: 400 }
      )
    }

    const accessCode = generateNumericAccessCode()
    const accessCodeHash = await hashAccessCode(accessCode)

    await prisma.waiter.update({
      where: { id: waiterId },
      data: { accessCodeHash },
    })

    return NextResponse.json({ waiterId, accessCode })
  } catch (error) {
    console.error('Error resetting access code:', error)
    return NextResponse.json(
      { error: 'Failed to reset access code' },
      { status: 500 }
    )
  }
}

