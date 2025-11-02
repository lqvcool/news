import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export interface JWTPayload {
  userId: string
  email: string
}

export interface AuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// 验证密码
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// 生成JWT令牌
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '1h'
  })
}

// 生成刷新令牌
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d'
  })
}

// 验证JWT令牌
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
  } catch (error) {
    throw new AuthError('Invalid token', 'INVALID_TOKEN')
  }
}

// 验证刷新令牌
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload
  } catch (error) {
    throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN')
  }
}

// 根据邮箱查找用户
export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      settings: true
    }
  })
}

// 根据ID查找用户
export async function findUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true
    }
  })
  return user
}

// 创建用户
export async function createUser(userData: {
  email: string
  password: string
  name?: string
  emailToken?: string
}) {
  const hashedPassword = await hashPassword(userData.password)

  return await prisma.user.create({
    data: {
      email: userData.email,
      passwordHash: hashedPassword,
      name: userData.name,
      emailToken: userData.emailToken
    },
    include: {
      settings: true
    }
  })
}

// 验证邮箱
export async function verifyEmail(token: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { emailToken: token }
  })

  if (!user) {
    throw new AuthError('Invalid verification token', 'INVALID_TOKEN')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailToken: null
    }
  })

  return true
}

// 生成邮箱验证令牌
export function generateEmailToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成密码重置令牌
export function generatePasswordResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 重置密码
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { emailToken: token }
  })

  if (!user) {
    throw new AuthError('Invalid reset token', 'INVALID_TOKEN')
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      emailToken: null
    }
  })

  return true
}

// 重新导出prisma实例
export { prisma } from './prisma'