import { PrismaClient } from '@prisma/client'
import { validateDatabaseUrl } from '@/lib/utils/databaseUrl'

const { isValid, normalizedUrl, errorMessage } = validateDatabaseUrl(process.env.DATABASE_URL)

if (!isValid || !normalizedUrl) {
  const error = errorMessage || 'DATABASE_URL is invalid. Please check your environment variables.'
  console.error(error)
  throw new Error(error)
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: normalizedUrl,
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

