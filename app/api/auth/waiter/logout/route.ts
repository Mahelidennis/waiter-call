import { NextResponse } from 'next/server'
import { getWaiterSessionCookieName } from '@/lib/auth/waiterSession'

export async function POST() {
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
