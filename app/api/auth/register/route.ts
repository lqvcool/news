import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createUser,
  findUserByEmail,
  generateEmailToken,
  generateToken,
  generateRefreshToken,
  AuthError
} from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { registerSchema } from '@/lib/validations'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = registerSchema.parse(body)

    // 检查用户是否已存在
    const existingUser = await findUserByEmail(validatedData.email)
    if (existingUser) {
      return createErrorResponse('该邮箱已被注册', 409)
    }

    // 生成邮箱验证令牌
    const emailToken = generateEmailToken()

    // 创建用户
    const user = await createUser({
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.name,
      emailToken
    })

    // 发送验证邮件 (生产环境可选)
    let emailSent = false
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_EMAIL_VERIFICATION !== 'true') {
      emailSent = await sendVerificationEmail(
        user.email,
        user.name || '用户',
        emailToken
      )

      if (!emailSent) {
        console.warn('验证邮件发送失败，但用户创建成功')
      }
    } else {
      console.log('生产环境：跳过邮件验证')
      emailSent = true
    }

    // 生成JWT令牌
    const tokenPayload = {
      userId: user.id,
      email: user.email
    }

    const accessToken = generateToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // 创建用户设置（如果不存在）
    if (!user.settings) {
      // 这里会在后面的用户设置管理中实现
    }

    const message = emailSent && process.env.NODE_ENV !== 'production'
      ? '注册成功，请查收验证邮件'
      : '注册成功'

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      },
      accessToken,
      refreshToken,
      message
    })

  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse(error.issues[0].message, 400)
    }

    if (error instanceof AuthError) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('注册失败，请稍后重试', 500)
  }
}