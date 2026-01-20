import { NextResponse } from 'next/server'
import { validateDatabaseUrl } from '@/lib/utils/databaseUrl'
import { prisma } from '@/lib/db'

// Health check endpoint to verify environment variables and connections
export async function GET() {
  const databaseValidation = validateDatabaseUrl(process.env.DATABASE_URL)
  const databaseUrl = process.env.DATABASE_URL || ''

  let dbHealthy = false
  let dbError: any = null

  try {
    await prisma.$queryRaw`SELECT 1`
    dbHealthy = true
  } catch (error) {
    dbHealthy = false
    dbError = error
    console.error('[Health] Prisma connectivity failed:', error)
  }

  const checks = {
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    database: {
      url: !!process.env.DATABASE_URL,
      urlFormatValid: databaseValidation.isValid,
      urlPreview: databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'not set',
      warnings: databaseValidation.warnings,
      connectivity: dbHealthy ? 'healthy' : 'unhealthy',
      error:
        !dbHealthy && process.env.NODE_ENV === 'development'
          ? {
              message: dbError?.message,
              code: dbError?.code,
              stack: dbError?.stack,
            }
          : undefined,
    },
    timestamp: new Date().toISOString(),
  }

  const allGood = 
    checks.supabase.url &&
    checks.supabase.anonKey &&
    checks.supabase.serviceRoleKey &&
    checks.database.url &&
    checks.database.urlFormatValid &&
    dbHealthy

  const issues = []
  if (!checks.database.url) issues.push('DATABASE_URL is not set')
  else if (!checks.database.urlFormatValid && databaseValidation.errorMessage) issues.push(databaseValidation.errorMessage)
  if (!dbHealthy) issues.push('Database connectivity check failed')
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

