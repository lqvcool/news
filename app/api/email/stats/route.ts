import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { emailService } from '@/lib/email-service'

async function handleGetEmailStats(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const stats = await emailService.getEmailStats(request.user!.userId, days)

    return NextResponse.json({
      success: true,
      data: { stats }
    })

  } catch (error) {
    console.error('获取邮件统计错误:', error)
    return NextResponse.json(
      { error: '获取邮件统计失败' },
      { status: 500 }
    )
  }
}

export const GET = (request: NextRequest) => withAuth(request, handleGetEmailStats)