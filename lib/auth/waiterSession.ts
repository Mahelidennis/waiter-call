import crypto from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

const SESSION_COOKIE_NAME = 'waiter_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12 // 12 hours

function getSecret(): string {
  const secret = process.env.WAITER_SESSION_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('Missing WAITER_SESSION_SECRET')
  }
  return secret
}

export type WaiterSession = {
  waiterId: string
  restaurantId: string
  exp: number
}

function signPayload(payload: Omit<WaiterSession, 'exp'>, secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  const base = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(base).digest('base64url')
  return `${base}.${signature}`
}

function verifyToken(token: string, secret: string): WaiterSession | null {
  const [base, signature] = token.split('.')
  if (!base || !signature) return null

  const expectedSig = crypto.createHmac('sha256', secret).update(base).digest('base64url')
  if (expectedSig.length !== signature.length) {
    return null
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(base, 'base64url').toString()) as WaiterSession
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export function createWaiterSessionToken(waiterId: string, restaurantId: string): {
  token: string
  maxAge: number
} {
  const secret = getSecret()
  const token = signPayload({ waiterId, restaurantId }, secret)
  return { token, maxAge: SESSION_MAX_AGE_SECONDS }
}

export async function getWaiterSessionFromCookies(): Promise<WaiterSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const secret = getSecret()
  return verifyToken(token, secret)
}

export function clearWaiterSessionCookie() {
  // cookies() is mutable only in route handlers / server actions; ignore errors elsewhere
  try {
    const store = cookies()
    ;(store as any).set?.({
      name: SESSION_COOKIE_NAME,
      value: '',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production',
    })
  } catch {
    // no-op
  }
}

export function getWaiterSessionCookieName() {
  return SESSION_COOKIE_NAME
}

export async function requireWaiterSession(waiterId?: string) {
  const session = await getWaiterSessionFromCookies()
  if (!session) {
    throw new Error('UNAUTHENTICATED')
  }

  if (waiterId && session.waiterId !== waiterId) {
    throw new Error('FORBIDDEN')
  }

  const waiter = await prisma.waiter.findUnique({
    where: { id: session.waiterId },
    select: {
      id: true,
      name: true,
      restaurantId: true,
      isActive: true,
    },
  })

  if (!waiter || !waiter.isActive) {
    throw new Error('INACTIVE_WAITER')
  }

  return waiter
}

