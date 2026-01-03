import { PrismaClient } from '@prisma/client'
import { validateDatabaseUrl } from '@/lib/utils/databaseUrl'

// Validate DATABASE_URL but don't throw during build
// This allows the build to complete even if env vars aren't set yet
const databaseUrl = process.env.DATABASE_URL
const validation = validateDatabaseUrl(databaseUrl)

// Only log errors, don't throw during module load (build time)
if (!validation.isValid) {
  console.error('DATABASE_URL validation warning:', validation.errorMessage)
  console.error('Build will continue, but database operations will fail at runtime if not fixed.')
}

// Use validated URL if valid, otherwise use original (Prisma will handle the error)
const normalizedUrl = validation.normalizedUrl || databaseUrl

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: normalizedUrl || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle Prisma disconnection gracefully
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

