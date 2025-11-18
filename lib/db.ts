import { PrismaClient } from '@prisma/client'

// Validate DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  const error = 'DATABASE_URL is not set. Please check your Vercel environment variables.'
  console.error(error)
  throw new Error(error)
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  const error = `DATABASE_URL must start with 'postgresql://' or 'postgres://'. Current value starts with: ${databaseUrl.substring(0, 20)}...`
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
        url: databaseUrl,
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

