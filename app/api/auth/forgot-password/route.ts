import { NextRequest } from 'next/server'
import { z } from 'zod'
import { findUserByEmail, generatePasswordResetToken, prisma } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { forgotPasswordSchema } from '@/lib/validations'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = forgotPasswordSchema.parse(body)

    // 查找用户
    const user = await findUserByEmail(validatedData.email)
    if (!user) {
      // 为了安全，即使用户不存在也返回成功消息
      return createSuccessResponse({
        message: '如果该邮箱已注册，您将收到密码重置邮件'
      })
    }

    // 生成重置令牌
    const resetToken = generatePasswordResetToken()

    // 更新用户的重置令牌
    await prisma.user.update({
      where: { id: user.id },
      data: { emailToken: resetToken }
    })

    // 发送重置邮件
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.name || '用户',
      resetToken
    )

    if (!emailSent) {
      console.warn('密码重置邮件发送失败')
      return createErrorResponse('邮件发送失败，请稍后重试', 500)
    }

    return createSuccessResponse({
      message: '如果该邮箱已注册，您将收到密码重置邮件'
    })

  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse(error.issues[0].message, 400)
    }

    return createErrorResponse('处理请求时发生错误，请稍后重试', 500)
  }
}