import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAccessCode } from '@/lib/auth/waiterAccess'
import {
  createWaiterSessionToken,
  getWaiterSessionCookieName,
} from '@/lib/auth/waiterSession'

type LoginBody = {
  restaurantId?: string
  restaurantCode?: string
  accessCode: string
}

const ATTEMPT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5
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

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request)
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  let body: LoginBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const accessCode = body.accessCode?.trim()
  if (!accessCode || accessCode.length < 4 || accessCode.length > 8) {
    recordAttempt(clientKey)
    return NextResponse.json({ error: 'Invalid access code' }, { status: 400 })
  }

  if (!body.restaurantId && !body.restaurantCode) {
    recordAttempt(clientKey)
    return NextResponse.json(
      { error: 'Restaurant is required' },
      { status: 400 }
    )
  }

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

  const waiters = await prisma.waiter.findMany({
    where: {
      restaurantId: restaurant.id,
      isActive: true,
      accessCodeHash: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      accessCodeHash: true,
      restaurantId: true,
    },
  })

  let matchedWaiter:
    | {
        id: string
        name: string
        restaurantId: string
        accessCodeHash: string
      }
    | null = null

  for (const waiter of waiters) {
    if (!waiter.accessCodeHash) continue
    const isValid = await verifyAccessCode(accessCode, waiter.accessCodeHash)
    if (isValid) {
      matchedWaiter = waiter
      break
    }
  }

  if (!matchedWaiter) {
    recordAttempt(clientKey)
    return NextResponse.json(
      { error: 'Invalid access code or inactive waiter' },
      { status: 401 }
    )
  }

  const { token, maxAge } = createWaiterSessionToken(
    matchedWaiter.id,
    restaurant.id
  )

  const response = NextResponse.json({
    waiter: {
      id: matchedWaiter.id,
      name: matchedWaiter.name,
      restaurantId: matchedWaiter.restaurantId,
      restaurantName: restaurant.name,
      restaurantSlug: restaurant.slug,
    },
  })

  response.cookies.set({
    name: getWaiterSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: getWaiterSessionCookieName(),
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })
  return response
}

