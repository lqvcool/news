import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { taskScheduler } from '@/lib/scheduler'

async function handleGetSchedulerStatus(request: AuthenticatedRequest) {
  try {
    // 这里可以添加管理员权限检查
    // 现在简化为所有登录用户都可以查看

    const tasks = taskScheduler.getTaskStatus()

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('获取调度器状态错误:', error)
    return NextResponse.json(
      { error: '获取调度器状态失败' },
      { status: 500 }
    )
  }
}

export const GET = (request: NextRequest) => withAuth(request, handleGetSchedulerStatus)