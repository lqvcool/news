import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { emailService } from '@/lib/email-service'

async function handleSendTestEmail(request: AuthenticatedRequest) {
  try {
    const success = await emailService.sendTestEmail(request.user!.userId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: '测试邮件发送成功，请查收'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '测试邮件发送失败'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('发送测试邮件错误:', error)
    return NextResponse.json(
      { error: '发送测试邮件失败' },
      { status: 500 }
    )
  }
}

export const POST = (request: NextRequest) => withAuth(request, handleSendTestEmail)