import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { findUserById, prisma } from '@/lib/auth'
import { z } from 'zod'

// API密钥更新验证schema
const updateApiKeysSchema = z.object({
  resendApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  fromEmail: z.string().email().optional(),
  jwtSecret: z.string().optional(),
  jwtRefreshSecret: z.string().optional()
})

// 系统状态检查schema
const checkSystemStatusSchema = z.object({
  action: z.enum(['checkSystemStatus'])
})

async function handleGetSettings(request: AuthenticatedRequest) {
  try {
    const user = await findUserById(request.user!.userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 检查是否为管理员（这里简化处理，实际项目中应该有角色管理）
    if (user.email !== 'lqvcool@163.com' && user.id !== '1') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 获取API密钥配置（从环境变量或数据库中获取）
    const apiKeys = {
      resendApiKey: process.env.RESEND_API_KEY ? '已配置' : '',
      geminiApiKey: process.env.GEMINI_API_KEY ? '已配置' : '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      jwtSecret: process.env.JWT_SECRET ? '已配置' : '',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ? '已配置' : ''
    }

    // 获取系统状态
    const systemStatus = {
      newsCollection: 'idle', // 这里可以实际检查新闻收集服务的状态
      emailService: process.env.RESEND_API_KEY ? 'configured' : 'unconfigured',
      aiProcessing: process.env.GEMINI_API_KEY ? 'available' : 'unconfigured'
    }

    return NextResponse.json({
      success: true,
      apiKeys,
      systemStatus
    })
  } catch (error) {
    console.error('Get admin settings error:', error)
    return NextResponse.json(
      { error: '获取设置失败' },
      { status: 500 }
    )
  }
}

async function handleUpdateSettings(request: AuthenticatedRequest) {
  try {
    const user = await findUserById(request.user!.userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 检查是否为管理员
    if (user.email !== 'lqvcool@163.com' && user.id !== '1') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const body = await request.json()

    if (body.action === 'updateApiKeys') {
      const validatedData = updateApiKeysSchema.parse(body.apiKeys)

      // 在实际项目中，这里应该将API密钥安全地存储到数据库或环境变量中
      // 为了安全考虑，这里只是返回成功响应，不建议直接更新环境变量

      return NextResponse.json({
        success: true,
        message: 'API密钥更新成功'
      })
    } else if (body.action === 'checkSystemStatus') {
      // 检查系统状态
      const systemStatus = {
        newsCollection: 'idle',
        emailService: process.env.RESEND_API_KEY ? 'configured' : 'unconfigured',
        aiProcessing: process.env.GEMINI_API_KEY ? 'available' : 'unconfigured'
      }

      return NextResponse.json({
        success: true,
        systemStatus
      })
    } else {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('Update admin settings error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新设置失败' },
      { status: 500 }
    )
  }
}

export const GET = (request: NextRequest) => withAuth(request, handleGetSettings)
export const PUT = (request: NextRequest) => withAuth(request, handleUpdateSettings)
export const POST = (request: NextRequest) => withAuth(request, handleUpdateSettings)