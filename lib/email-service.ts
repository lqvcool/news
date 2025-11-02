import { prisma } from './prisma'
import { sendEmail } from './email'
import { geminiProcessor } from './gemini'
import { generateNewsDigestEmail } from './email-templates'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export interface EmailJob {
  id: string
  userId: string
  type: 'daily_digest' | 'weekly_digest' | 'custom'
  scheduledTime: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  processedAt?: Date
  error?: string
}

export class EmailService {
  private static instance: EmailService
  private processingJobs = new Map<string, boolean>()

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // 发送每日新闻摘要
  async sendDailyDigest(userId: string): Promise<boolean> {
    try {
      // 防止重复处理
      if (this.processingJobs.get(`daily_${userId}`)) {
        console.log(`用户 ${userId} 的每日摘要正在处理中，跳过`)
        return true
      }

      this.processingJobs.set(`daily_${userId}`, true)

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { settings: true }
      })

      if (!user || !user.emailVerified) {
        console.log(`用户 ${userId} 不存在或邮箱未验证`)
        return false
      }

      // 检查用户设置
      if (!user.settings?.isActive) {
        console.log(`用户 ${userId} 已禁用邮件推送`)
        return false
      }

      // 获取过去24小时的新闻
      const now = new Date()
      const yesterday = subDays(now, 1)

      const recentArticles = await prisma.newsArticle.findMany({
        where: {
          publishedAt: {
            gte: yesterday,
            lte: now
          },
          summary: {
            not: null
          }
        },
        include: {
          source: true
        },
        orderBy: { publishedAt: 'desc' }
      })

      if (recentArticles.length === 0) {
        console.log(`过去24小时没有新新闻，跳过用户 ${userId} 的邮件发送`)
        return true
      }

      // 根据用户设置过滤新闻
      const filteredArticles = this.filterArticlesByUserSettings(
        recentArticles,
        user.settings
      )

      if (filteredArticles.length === 0) {
        console.log(`没有符合用户 ${userId} 偏好的新闻，跳过邮件发送`)
        return true
      }

      // 转换为AI处理格式
      const processedArticles = filteredArticles.map(article => ({
        id: article.id,
        originalTitle: article.title,
        processedTitle: article.title,
        summary: article.summary || '',
        category: article.category || '未分类',
        sentiment: 'neutral' as const,
        keywords: JSON.parse(article.tags || '[]'),
        importanceScore: 0.5,
        readingTime: 2
      }))

      // 生成新闻摘要
      const digest = await geminiProcessor.generateDigest(processedArticles)

      // 生成邮件内容
      const emailTemplate = generateNewsDigestEmail(
        user.name || '用户',
        digest
      )

      // 发送邮件
      const emailSent = await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.htmlContent,
        text: emailTemplate.textContent
      })

      if (emailSent) {
        // 记录邮件发送日志
        await prisma.emailLog.create({
          data: {
            userId: user.id,
            subject: emailTemplate.subject,
            content: emailTemplate.textContent,
            sentAt: new Date()
          }
        })

        console.log(`成功发送每日新闻摘要给用户 ${user.email}`)
        return true
      } else {
        console.error(`发送邮件失败给用户 ${user.email}`)
        return false
      }

    } catch (error) {
      console.error(`发送每日摘要失败 (用户: ${userId}):`, error)
      return false
    } finally {
      this.processingJobs.delete(`daily_${userId}`)
    }
  }

  // 批量发送给所有活跃用户
  async sendDailyDigestToAllActiveUsers(): Promise<{
    total: number
    success: number
    failed: number
  }> {
    console.log('开始给所有活跃用户发送每日新闻摘要...')

    // 获取所有活跃且邮箱已验证的用户
    const activeUsers = await prisma.user.findMany({
      where: {
        emailVerified: true,
        settings: {
          isActive: true,
          pushFrequency: 'daily'
        }
      },
      include: {
        settings: true
      }
    })

    console.log(`找到 ${activeUsers.length} 个活跃用户`)

    let successCount = 0
    let failedCount = 0

    for (const user of activeUsers) {
      try {
        const success = await this.sendDailyDigest(user.id)
        if (success) {
          successCount++
        } else {
          failedCount++
        }

        // 防止过于频繁的请求
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`处理用户 ${user.email} 时发生错误:`, error)
        failedCount++
      }
    }

    console.log(`每日摘要发送完成: 成功 ${successCount}, 失败 ${failedCount}`)
    return {
      total: activeUsers.length,
      success: successCount,
      failed: failedCount
    }
  }

  // 发送测试邮件
  async sendTestEmail(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return false
      }

      const testDigest = {
        title: '测试新闻摘要',
        summary: '这是一个测试邮件，用于验证邮件推送功能是否正常工作。',
        categories: [
          {
            name: '测试分类',
            articles: 3,
            highlights: [
              '这是第一条测试新闻的摘要',
              '这是第二条测试新闻的摘要',
              '这是第三条测试新闻的摘要'
            ]
          }
        ],
        trendingTopics: ['测试话题1', '测试话题2', '测试话题3'],
        sentiment: {
          positive: 40,
          negative: 10,
          neutral: 50
        }
      }

      const emailTemplate = generateNewsDigestEmail(
        user.name || '用户',
        testDigest
      )

      return await sendEmail({
        to: user.email,
        subject: `[测试] ${emailTemplate.subject}`,
        html: emailTemplate.htmlContent,
        text: emailTemplate.textContent
      })
    } catch (error) {
      console.error(`发送测试邮件失败 (用户: ${userId}):`, error)
      return false
    }
  }

  // 获取邮件发送统计
  async getEmailStats(userId: string, days: number = 30): Promise<{
    total: number
    sent: number
    opened: number
    clicked: number
    recent: any[]
  }> {
    const startDate = subDays(new Date(), days)

    const [total, sent, opened, clicked, recent] = await Promise.all([
      prisma.emailLog.count({
        where: {
          userId,
          sentAt: { gte: startDate }
        }
      }),
      prisma.emailLog.count({
        where: {
          userId,
          sentAt: { gte: startDate }
        }
      }),
      prisma.emailLog.count({
        where: {
          userId,
          sentAt: { gte: startDate },
          opened: true
        }
      }),
      prisma.emailLog.count({
        where: {
          userId,
          sentAt: { gte: startDate },
          clicked: true
        }
      }),
      prisma.emailLog.findMany({
        where: {
          userId,
          sentAt: { gte: startDate }
        },
        orderBy: { sentAt: 'desc' },
        take: 10,
        select: {
          id: true,
          subject: true,
          sentAt: true,
          opened: true,
          clicked: true,
          openedAt: true,
          clickedAt: true
        }
      })
    ])

    return {
      total,
      sent,
      opened,
      clicked,
      recent
    }
  }

  // 根据用户设置过滤新闻
  private filterArticlesByUserSettings(
    articles: any[],
    settings: any
  ): any[] {
    let filtered = articles

    // 根据选择的新闻源过滤
    if (settings.selectedSources) {
      const selectedSourceIds = JSON.parse(settings.selectedSources)
      if (selectedSourceIds.length > 0) {
        filtered = filtered.filter(article =>
          selectedSourceIds.includes(article.sourceId)
        )
      }
    }

    // 根据分类过滤
    if (settings.categoriesFilter) {
      const allowedCategories = JSON.parse(settings.categoriesFilter)
      if (allowedCategories.length > 0) {
        filtered = filtered.filter(article =>
          allowedCategories.includes(article.category)
        )
      }
    }

    // 根据关键词过滤
    if (settings.keywordsFilter) {
      const keywords = JSON.parse(settings.keywordsFilter)
      if (keywords.length > 0) {
        filtered = filtered.filter(article => {
          const content = `${article.title} ${article.content || ''}`.toLowerCase()
          return keywords.some((keyword: string) =>
            content.includes(keyword.toLowerCase())
          )
        })
      }
    }

    return filtered
  }

  // 清理过期的处理锁
  cleanupProcessingLocks(): void {
    // 定期清理处理锁，防止内存泄漏
    const maxAge = 30 * 60 * 1000 // 30分钟
    const now = Date.now()

    for (const [key] of this.processingJobs.entries()) {
      // 简化的清理逻辑，实际实现中可以添加时间戳
      if (Math.random() < 0.01) { // 随机清理一些锁
        this.processingJobs.delete(key)
      }
    }
  }
}

// 导出单例实例
export const emailService = EmailService.getInstance()