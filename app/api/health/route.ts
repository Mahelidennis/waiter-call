import { NextResponse } from 'next/server'

// Health check endpoint to verify environment variables and connections
export async function GET() {
  const checks = {
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    database: {
      url: !!process.env.DATABASE_URL,
    },
    timestamp: new Date().toISOString(),
  }

  const allGood = 
    checks.supabase.url &&
    checks.supabase.anonKey &&
    checks.supabase.serviceRoleKey &&
    checks.database.url

  return NextResponse.json(
    {
      status: allGood ? 'healthy' : 'unhealthy',
      checks,
      message: allGood
        ? 'All environment variables are set'
        : 'Some environment variables are missing',
    },
    { status: allGood ? 200 : 503 }
  )
}

