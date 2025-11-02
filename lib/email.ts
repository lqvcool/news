import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email sending')
      return true // 开发环境下跳过邮件发送
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text
    })

    if (error) {
      console.error('Email sending error:', error)
      return false
    }

    console.log('Email sent successfully:', data)
    return true
  } catch (error) {
    console.error('Email service error:', error)
    return false
  }
}

export function generateVerificationEmailHTML(name: string, verificationLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>验证您的邮箱地址</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>欢迎加入 NewsHub!</h1>
      </div>
      <div class="content">
        <p>你好 ${name}，</p>
        <p>感谢您注册 NewsHub - 智能新闻收集推送系统。</p>
        <p>请点击下面的按钮验证您的邮箱地址：</p>
        <a href="${verificationLink}" class="button">验证邮箱</a>
        <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
        <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${verificationLink}</p>
        <p>此链接将在24小时后失效。</p>
      </div>
      <div class="footer">
        <p>如果您没有注册 NewsHub，请忽略此邮件。</p>
        <p>© 2024 NewsHub. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export function generatePasswordResetEmailHTML(name: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>重置您的密码</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>重置密码</h1>
      </div>
      <div class="content">
        <p>你好 ${name}，</p>
        <p>我们收到了您重置 NewsHub 账户密码的请求。</p>
        <p>请点击下面的按钮重置您的密码：</p>
        <a href="${resetLink}" class="button">重置密码</a>
        <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
        <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${resetLink}</p>
        <p>此链接将在1小时后失效。</p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
      </div>
      <div class="footer">
        <p>© 2024 NewsHub. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const verificationLink = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`

  return await sendEmail({
    to: email,
    subject: '验证您的 NewsHub 邮箱地址',
    html: generateVerificationEmailHTML(name, verificationLink),
    text: `请访问以下链接验证您的邮箱：${verificationLink}`
  })
}

export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  return await sendEmail({
    to: email,
    subject: '重置您的 NewsHub 密码',
    html: generatePasswordResetEmailHTML(name, resetLink),
    text: `请访问以下链接重置您的密码：${resetLink}`
  })
}