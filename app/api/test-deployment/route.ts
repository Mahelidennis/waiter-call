import { NextResponse } from 'next/server'

/**
 * Simple test to check if deployment is working
 */
export async function GET() {
  return NextResponse.json({
    status: '✅ API is working',
    timestamp: new Date().toISOString(),
    deployment: 'waiter-call-nuyfd1lo2-mahelis-projects.vercel.app'
  })
}
