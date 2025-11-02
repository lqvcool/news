import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { findUserById } from '@/lib/auth'
import { z } from 'zod'
import { Resend } from 'resend'

const testEmailSchema = z.object({
  email: z.string().email(),
  message: z.string().min(1, '消息内容不能为空')
})

async function handleTestEmail(request: AuthenticatedRequest) {
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
    const validatedData = testEmailSchema.parse(body)

    // 检查Resend API密钥是否配置
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: '邮件服务未配置，请先设置RESEND_API_KEY' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev', // 使用环境变量或默认地址
        to: ['liangqin2016@gmail.com'], // 使用示例中的测试邮箱
        subject: '测试邮件 - 智能新闻平台',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">智能新闻平台</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #333; margin-top: 0;">邮件服务测试</h2>
              <p style="color: #666; line-height: 1.6;">您好！</p>
              <p style="color: #666; line-height: 1.6;">这是一封测试邮件，用于验证邮件服务配置是否正确。</p>
              <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="color: #333; margin: 0;"><strong>测试消息：</strong></p>
                <p style="color: #666; margin: 10px 0 0 0;">${validatedData.message}</p>
              </div>
              <p style="color: #666; line-height: 1.6;">如果您收到此邮件，说明邮件服务配置成功！</p>
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 14px;">此邮件由智能新闻平台自动发送</p>
              </div>
            </div>
            <div style="background: #333; color: white; text-align: center; padding: 20px;">
              <p style="margin: 0; font-size: 14px;">© 2024 智能新闻平台. 保留所有权利.</p>
            </div>
          </div>
        `
      })

      if (error) {
        console.error('Resend API error:', error)
        return NextResponse.json({ error: `邮件发送失败: ${error.message}` }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: '测试邮件发送成功',
        data: {
          id: data?.id,
          to: validatedData.email
        }
      })
    } catch (resendError: any) {
      console.error('Resend send error:', resendError)
      return NextResponse.json({
        error: `邮件服务错误: ${resendError.message || '未知错误'}`
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '邮件测试失败' },
      { status: 500 }
    )
  }
}

export const POST = (request: NextRequest) => withAuth(request, handleTestEmail)