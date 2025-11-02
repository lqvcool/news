import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  findUserByEmail,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  AuthError
} from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = loginSchema.parse(body)

    // 查找用户
    const user = await findUserByEmail(validatedData.email)
    if (!user) {
      return createErrorResponse('邮箱或密码错误', 401)
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(validatedData.password, user.passwordHash)
    if (!isPasswordValid) {
      return createErrorResponse('邮箱或密码错误', 401)
    }

    // 生成JWT令牌
    const tokenPayload = {
      userId: user.id,
      email: user.email
    }

    const accessToken = generateToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      },
      accessToken,
      refreshToken,
      message: '登录成功'
    })

  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse(error.issues[0].message, 400)
    }

    if (error instanceof AuthError) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('登录失败，请稍后重试', 500)
  }
}