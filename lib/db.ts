import { PrismaClient } from '@prisma/client'
import { validateDatabaseUrl } from '@/lib/utils/databaseUrl'

const validation = validateDatabaseUrl(process.env.DATABASE_URL)

// Log validation results but never block the build
if (!validation.isValid && validation.errorMessage) {
  console.error('[DB] DATABASE_URL invalid:', validation.errorMessage)
  console.error('[DB] Prisma will fail at runtime until this is fixed.')
}

if (validation.warnings?.length) {
  console.warn('[DB] DATABASE_URL warnings:', validation.warnings.join(' | '))
}

const datasourceUrl =
  validation.normalizedUrl ||
  process.env.DATABASE_URL ||
  'postgresql://placeholder:placeholder@localhost:6543/placeholder?sslmode=require&pgbouncer=true&connection_limit=1'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: datasourceUrl,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Cache the client in development to survive hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle Prisma disconnection gracefully
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

