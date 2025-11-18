import { NextResponse } from 'next/server'

// Health check endpoint to verify environment variables and connections
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || ''
  const databaseUrlValid = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
  
  const checks = {
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    database: {
      url: !!process.env.DATABASE_URL,
      urlFormatValid: databaseUrlValid,
      urlPreview: databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'not set',
    },
    timestamp: new Date().toISOString(),
  }

  const allGood = 
    checks.supabase.url &&
    checks.supabase.anonKey &&
    checks.supabase.serviceRoleKey &&
    checks.database.url &&
    checks.database.urlFormatValid

  const issues = []
  if (!checks.database.url) issues.push('DATABASE_URL is not set')
  else if (!checks.database.urlFormatValid) issues.push(`DATABASE_URL format is invalid. Must start with 'postgresql://' or 'postgres://'`)
  if (!checks.supabase.url) issues.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!checks.supabase.anonKey) issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  if (!checks.supabase.serviceRoleKey) issues.push('SUPABASE_SERVICE_ROLE_KEY is not set')

  return NextResponse.json(
    {
      status: allGood ? 'healthy' : 'unhealthy',
      checks,
      issues: issues.length > 0 ? issues : undefined,
      message: allGood
        ? 'All environment variables are set and valid'
        : `Issues found: ${issues.join(', ')}`,
    },
    { status: allGood ? 200 : 503 }
  )
}

