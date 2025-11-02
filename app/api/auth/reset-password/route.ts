import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resetPassword, AuthError } from '@/lib/auth'
import { resetPasswordSchema } from '@/lib/validations'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = resetPasswordSchema.parse(body)

    // 重置密码
    await resetPassword(validatedData.token, validatedData.password)

    return createSuccessResponse({
      message: '密码重置成功，请使用新密码登录'
    })

  } catch (error) {
    console.error('Reset password error:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse(error.issues[0].message, 400)
    }

    if (error instanceof AuthError) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('密码重置失败，请稍后重试', 500)
  }
}