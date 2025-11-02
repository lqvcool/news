import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { taskScheduler } from '@/lib/scheduler'
import { z } from 'zod'

const executeTaskSchema = z.object({
  taskName: z.string().min(1, '任务名称不能为空')
})

async function handleExecuteTask(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const validatedData = executeTaskSchema.parse(body)

    // 这里可以添加管理员权限检查
    // 现在简化为所有登录用户都可以执行

    const success = await taskScheduler.executeTaskManually(validatedData.taskName)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `任务 ${validatedData.taskName} 执行成功`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `任务 ${validatedData.taskName} 不存在或执行失败`
      }, { status: 400 })
    }

  } catch (error) {
    console.error('执行任务错误:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '执行任务失败' },
      { status: 500 }
    )
  }
}

export const POST = (request: NextRequest) => withAuth(request, handleExecuteTask)