import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateNumericAccessCode, hashAccessCode } from '@/lib/auth/waiterAccess'

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 3
const attemptStore = new Map<string, number[]>()

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(',')
      .map((value) => value.trim())
      .find(Boolean)
    if (firstIp) return firstIp
  }

  const realIp = request.headers.get('x-real-ip')
  return realIp ?? 'unknown'
}

function recordAttempt(key: string) {
  const now = Date.now()
  const attempts = attemptStore.get(key) || []
  const recent = attempts.filter((ts) => now - ts < ATTEMPT_WINDOW_MS)
  recent.push(now)
  attemptStore.set(key, recent)
}

function isRateLimited(key: string) {
  const attempts = attemptStore.get(key)
  if (!attempts) return false
  const now = Date.now()
  const recent = attempts.filter((ts) => now - ts < ATTEMPT_WINDOW_MS)
  attemptStore.set(key, recent)
  return recent.length >= MAX_ATTEMPTS_PER_WINDOW
}

type ResetBody = {
  restaurantId?: string
  restaurantCode?: string
  email?: string
  phone?: string
  waiterName?: string
}

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request)
  
  try {
    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      )
    }

    let body: ResetBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Validate restaurant
    if (!body.restaurantId && !body.restaurantCode) {
      recordAttempt(clientKey)
      return NextResponse.json(
        { error: 'Restaurant is required' },
        { status: 400 }
      )
    }

    // Validate at least one identifier field
    if (!body.email && !body.phone && !body.waiterName) {
      recordAttempt(clientKey)
      return NextResponse.json(
        { error: 'Please provide email, phone, or name to identify your account' },
        { status: 400 }
      )
    }

    // Find restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: body.restaurantId
        ? { id: body.restaurantId }
        : { OR: [{ slug: body.restaurantCode! }, { id: body.restaurantCode! }] },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    if (!restaurant) {
      recordAttempt(clientKey)
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Build waiter query
    const waiterQuery: any = {
      restaurantId: restaurant.id,
      isActive: true,
    }

    // Add identifier conditions
    const identifierConditions = []
    if (body.email) {
      identifierConditions.push({ email: body.email.toLowerCase().trim() })
    }
    if (body.phone) {
      identifierConditions.push({ phone: body.phone.trim() })
    }
    if (body.waiterName) {
      identifierConditions.push({ name: { contains: body.waiterName.trim(), mode: 'insensitive' } })
    }

    if (identifierConditions.length > 0) {
      waiterQuery.OR = identifierConditions
    }

    // Find waiters matching the criteria
    const waiters = await prisma.waiter.findMany({
      where: waiterQuery,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        restaurantId: true,
      },
    })

    if (waiters.length === 0) {
      recordAttempt(clientKey)
      return NextResponse.json(
        { error: 'No active waiter found with the provided information' },
        { status: 404 }
      )
    }

    // If multiple waiters found, require more specific information
    if (waiters.length > 1) {
      return NextResponse.json({
        error: 'Multiple waiters found. Please provide more specific information (email or phone).',
        waiters: waiters.map(w => ({ name: w.name, email: w.email ? '***' : undefined, phone: w.phone ? '***' : undefined }))
      }, { status: 300 }) // Use 300 for multiple choices
    }

    const waiter = waiters[0]

    // Generate new access code
    const newAccessCode = generateNumericAccessCode()
    const hashedCode = await hashAccessCode(newAccessCode)

    // Update waiter with new access code
    await prisma.waiter.update({
      where: { id: waiter.id },
      data: { accessCodeHash: hashedCode },
    })

    // In a real implementation, you would send this via email/SMS
    // For now, we'll return it in the response (for development)
    const response = NextResponse.json({
      success: true,
      message: 'Access code reset successfully',
      waiter: {
        name: waiter.name,
        email: waiter.email,
        phone: waiter.phone,
      },
      newAccessCode: process.env.NODE_ENV === 'development' ? newAccessCode : undefined,
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
      }
    })

    return response

  } catch (error: unknown) {
    recordAttempt(clientKey)
    console.error('Error resetting waiter access code:', error)
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
