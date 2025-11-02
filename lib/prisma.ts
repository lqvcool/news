import { PrismaClient } from '@prisma/client'

// Vercel环境下使用Prisma的推荐方式
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 在Vercel环境中，确保连接正确关闭
if (process.env.VERCEL) {
  // Vercel环境下不使用连接池
  prisma.$connect().catch((error) => {
    console.error('Prisma连接错误:', error)
  })
}