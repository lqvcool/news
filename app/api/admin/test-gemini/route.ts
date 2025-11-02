import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { findUserById } from '@/lib/auth'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'

const testGeminiSchema = z.object({
  prompt: z.string().min(1, '提示词不能为空').max(1000, '提示词过长')
})

async function handleTestGemini(request: AuthenticatedRequest) {
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
    const validatedData = testGeminiSchema.parse(body)

    // 检查Gemini API密钥是否配置
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI服务未配置，请先设置GEMINI_API_KEY' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // 尝试多个可能的模型，按优先级排序
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro']
    let model = null
    let lastError = null
    let workingModel = null

    for (const modelName of models) {
      try {
        model = genAI.getGenerativeModel({ model: modelName })
        // 只验证模型是否存在，不发送请求
        workingModel = modelName
        break // 如果成功创建模型对象，使用这个模型
      } catch (error: any) {
        lastError = error
        console.log(`模型 ${modelName} 不可用: ${error.message}`)
        continue
      }
    }

    if (!model) {
      return NextResponse.json({
        error: `所有AI模型都不可用。可能的原因：1. 地区限制 - Gemini API在某些地区不可用 2. API密钥问题。最后错误：${lastError?.message || '未知错误'}`
      }, { status: 500 })
    }

    try {
      // 添加超时控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI服务响应超时')), 30000) // 30秒超时
      })

      const apiPromise = model.generateContent(validatedData.prompt)

      const result = await Promise.race([apiPromise, timeoutPromise])
      const response = await result.response
      const text = response.text()

      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: 'AI服务返回空响应' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Gemini API测试成功',
        response: text,
        metadata: {
          model: workingModel,
          promptLength: validatedData.prompt.length,
          responseLength: text.length
        }
      })
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError)

      let errorMessage = 'AI服务测试失败'
      let suggestions = []

      if (geminiError.message) {
        if (geminiError.message.includes('quota')) {
          errorMessage = 'API配额已用完，请检查Google Cloud控制台'
          suggestions.push('检查Google Cloud控制台的API使用情况')
        } else if (geminiError.message.includes('permission')) {
          errorMessage = 'API密钥权限不足，请检查密钥配置'
          suggestions.push('确认API密钥已启用Gemini API权限')
        } else if (geminiError.message.includes('timeout')) {
          errorMessage = 'AI服务响应超时，请稍后重试'
          suggestions.push('检查网络连接')
        } else if (geminiError.message.includes('location is not supported')) {
          errorMessage = '地区限制：Gemini API在当前地区不可用'
          suggestions.push('尝试使用VPN或代理服务器连接到支持的地区（如美国）')
          suggestions.push('或者考虑使用其他AI服务API')
        } else if (geminiError.message.includes('models/') && geminiError.message.includes('is not found')) {
          errorMessage = '模型不可用，可能需要更新API版本或模型名称'
          suggestions.push('检查Google AI文档获取最新的模型名称')
        } else {
          errorMessage = `AI服务错误: ${geminiError.message}`
        }
      }

      return NextResponse.json({
        error: errorMessage,
        suggestions: suggestions,
        technicalDetails: geminiError.message,
        modelAttempted: workingModel
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test Gemini error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    let errorMessage = 'Gemini测试失败'
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'AI服务响应超时，请稍后重试'
      } else {
        errorMessage = `测试失败: ${error.message}`
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export const POST = (request: NextRequest) => withAuth(request, handleTestGemini)