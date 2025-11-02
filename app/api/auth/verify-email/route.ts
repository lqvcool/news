import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail, AuthError } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return createErrorResponse('验证令牌无效', 400)
    }

    // 验证邮箱
    await verifyEmail(token)

    // 如果是API请求，返回JSON响应
    if (request.headers.get('accept')?.includes('application/json')) {
      return createSuccessResponse({
        message: '邮箱验证成功'
      })
    }

    // 如果是浏览器请求，重定向到成功页面
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/email-verified?success=true`)

  } catch (error) {
    console.error('Email verification error:', error)

    if (error instanceof AuthError) {
      // 如果是API请求，返回JSON错误
      if (request.headers.get('accept')?.includes('application/json')) {
        return createErrorResponse(error.message, 400)
      }

      // 如果是浏览器请求，重定向到错误页面
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/email-verified?error=${encodeURIComponent(error.message)}`)
    }

    return createErrorResponse('邮箱验证失败，请稍后重试', 500)
  }
}