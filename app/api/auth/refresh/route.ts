import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyRefreshToken, generateToken, findUserById, AuthError } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

const refreshSchema = z.object({
  refreshToken: z.string().min(1, '刷新令牌无效')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = refreshSchema.parse(body)

    // 验证刷新令牌
    const tokenPayload = verifyRefreshToken(validatedData.refreshToken)

    // 查找用户
    const user = await findUserById(tokenPayload.userId)
    if (!user) {
      return createErrorResponse('用户不存在', 401)
    }

    // 生成新的访问令牌
    const newAccessToken = generateToken({
      userId: user.id,
      email: user.email
    })

    return createSuccessResponse({
      accessToken: newAccessToken,
      message: '令牌刷新成功'
    })

  } catch (error) {
    console.error('Token refresh error:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse(error.issues[0].message, 400)
    }

    if (error instanceof AuthError) {
      return createErrorResponse(error.message, 401)
    }

    return createErrorResponse('令牌刷新失败', 500)
  }
}