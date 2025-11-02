import * as cron from 'node-cron'
import { NewsCollectorManager } from './news-collector'
import { geminiProcessor } from './gemini'
import { emailService } from './email-service'
import { prisma } from './prisma'

export interface ScheduledTask {
  name: string
  schedule: string
  handler: () => Promise<void>
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  running?: boolean
}

export class TaskScheduler {
  private static instance: TaskScheduler
  private tasks: Map<string, ScheduledTask> = new Map()
  private cronJobs: Map<string, cron.ScheduledTask> = new Map()

  private constructor() {
    this.initializeDefaultTasks()
  }

  static getInstance(): TaskScheduler {
    if (!TaskScheduler.instance) {
      TaskScheduler.instance = new TaskScheduler()
    }
    return TaskScheduler.instance
  }

  private initializeDefaultTasks(): void {
    // 每小时收集新闻
    this.addTask({
      name: 'collect_news',
      schedule: '0 * * * *', // 每小时的整点
      enabled: true,
      handler: async () => {
        await this.collectNewsTask()
      }
    })

    // 每天早上8点发送邮件摘要
    this.addTask({
      name: 'send_daily_digest',
      schedule: '0 8 * * *', // 每天早上8点
      enabled: true,
      handler: async () => {
        await this.sendDailyDigestTask()
      }
    })

    // 每天凌晨1点清理旧数据
    this.addTask({
      name: 'cleanup_old_data',
      schedule: '0 1 * * *', // 每天凌晨1点
      enabled: true,
      handler: async () => {
        await this.cleanupOldDataTask()
      }
    })

    // 每天凌晨2点处理新闻AI分析
    this.addTask({
      name: 'process_news_ai',
      schedule: '0 2 * * *', // 每天凌晨2点
      enabled: true,
      handler: async () => {
        await this.processNewsAITask()
      }
    })
  }

  addTask(task: ScheduledTask): void {
    // 如果任务已存在，先停止
    if (this.tasks.has(task.name)) {
      this.removeTask(task.name)
    }

    this.tasks.set(task.name, task)

    if (task.enabled) {
      this.startTask(task.name)
    }

    console.log(`任务 ${task.name} 已添加，调度时间: ${task.schedule}`)
  }

  removeTask(taskName: string): void {
    this.stopTask(taskName)
    this.tasks.delete(taskName)
    console.log(`任务 ${taskName} 已移除`)
  }

  startTask(taskName: string): void {
    const task = this.tasks.get(taskName)
    if (!task) {
      console.error(`任务 ${taskName} 不存在`)
      return
    }

    // 停止现有的定时任务
    this.stopTask(taskName)

    // 创建新的定时任务
    const cronJob = cron.schedule(task.schedule, async () => {
      await this.executeTask(taskName)
    }, {
      timezone: 'Asia/Shanghai'
    })

    this.cronJobs.set(taskName, cronJob)
    task.enabled = true

    console.log(`任务 ${taskName} 已启动`)
  }

  stopTask(taskName: string): void {
    const cronJob = this.cronJobs.get(taskName)
    if (cronJob) {
      cronJob.stop()
      this.cronJobs.delete(taskName)
      console.log(`任务 ${taskName} 已停止`)
    }

    const task = this.tasks.get(taskName)
    if (task) {
      task.enabled = false
    }
  }

  async executeTask(taskName: string): Promise<void> {
    const task = this.tasks.get(taskName)
    if (!task) {
      console.error(`任务 ${taskName} 不存在`)
      return
    }

    if (task.running) {
      console.log(`任务 ${taskName} 正在运行中，跳过本次执行`)
      return
    }

    console.log(`开始执行任务: ${task.name}`)
    task.running = true
    task.lastRun = new Date()

    try {
      const startTime = Date.now()
      await task.handler()
      const duration = Date.now() - startTime

      console.log(`任务 ${task.name} 执行完成，耗时: ${duration}ms`)
    } catch (error) {
      console.error(`任务 ${task.name} 执行失败:`, error)
    } finally {
      task.running = false
    }
  }

  async executeTaskManually(taskName: string): Promise<boolean> {
    const task = this.tasks.get(taskName)
    if (!task) {
      console.error(`任务 ${taskName} 不存在`)
      return false
    }

    console.log(`手动执行任务: ${task.name}`)
    await this.executeTask(taskName)
    return true
  }

  getTaskStatus(): Array<{
    name: string
    schedule: string
    enabled: boolean
    running: boolean
    lastRun?: Date
    nextRun?: Date
  }> {
    return Array.from(this.tasks.values()).map(task => ({
      name: task.name,
      schedule: task.schedule,
      enabled: task.enabled,
      running: !!task.running,
      lastRun: task.lastRun,
      nextRun: task.nextRun
    }))
  }

  // 具体任务实现
  private async collectNewsTask(): Promise<void> {
    console.log('开始收集新闻任务...')
    const manager = NewsCollectorManager.getInstance()
    const collectedCount = await manager.collectFromAllActiveSources()
    console.log(`新闻收集任务完成，共收集 ${collectedCount} 条新闻`)
  }

  private async sendDailyDigestTask(): Promise<void> {
    console.log('开始发送每日新闻摘要任务...')
    const result = await emailService.sendDailyDigestToAllActiveUsers()
    console.log(`每日摘要发送任务完成: 总计 ${result.total}，成功 ${result.success}，失败 ${result.failed}`)
  }

  private async cleanupOldDataTask(): Promise<void> {
    console.log('开始清理旧数据任务...')

    // 清理30天前的新闻
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const deletedNews = await prisma.newsArticle.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    // 清理90天前的邮件日志
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const deletedLogs = await prisma.emailLog.deleteMany({
      where: {
        sentAt: {
          lt: ninetyDaysAgo
        }
      }
    })

    console.log(`数据清理完成: 删除了 ${deletedNews.count} 条新闻，${deletedLogs.count} 条邮件日志`)
  }

  private async processNewsAITask(): Promise<void> {
    console.log('开始AI处理新闻任务...')

    // 获取过去24小时内未处理的新闻
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const unprocessedArticles = await prisma.newsArticle.findMany({
      where: {
        publishedAt: {
          gte: twentyFourHoursAgo
        },
        summary: null
      },
      take: 50 // 限制处理数量
    })

    console.log(`找到 ${unprocessedArticles.length} 条未处理的新闻`)

    let processedCount = 0

    for (const article of unprocessedArticles) {
      try {
        const processed = await geminiProcessor.processNews({
          title: article.title,
          content: article.content || undefined,
          url: article.url,
          author: article.author || undefined,
          publishedAt: article.publishedAt
        })

        await prisma.newsArticle.update({
          where: { id: article.id },
          data: {
            summary: processed.summary,
            category: processed.category,
            tags: JSON.stringify(processed.keywords)
          }
        })

        processedCount++
        console.log(`✓ AI处理完成: ${article.title}`)

        // 避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`✗ AI处理失败: ${article.title}`, error)
      }
    }

    console.log(`AI处理任务完成，成功处理 ${processedCount} 条新闻`)
  }

  // 启动所有已启用的任务
  startAllTasks(): void {
    for (const [taskName, task] of this.tasks.entries()) {
      if (task.enabled) {
        this.startTask(taskName)
      }
    }
    console.log('所有已启用的任务已启动')
  }

  // 停止所有任务
  stopAllTasks(): void {
    for (const taskName of this.tasks.keys()) {
      this.stopTask(taskName)
    }
    console.log('所有任务已停止')
  }

  // 关闭调度器
  shutdown(): void {
    this.stopAllTasks()
    console.log('调度器已关闭')
  }
}

// 导出单例实例
export const taskScheduler = TaskScheduler.getInstance()