import { prisma } from '../lib/prisma'
import { hashPassword, generateEmailToken, createUser, findUserByEmail } from '../lib/auth'
import { NewsCollectorManager } from '../lib/news-collector'
import { geminiProcessor } from '../lib/gemini'
import { emailService } from '../lib/email-service'
import { taskScheduler } from '../lib/scheduler'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  details?: any
}

class SystemTest {
  private results: TestResult[] = []

  private addResult(name: string, status: TestResult['status'], message: string, details?: any) {
    const result: TestResult = { name, status, message, details }
    this.results.push(result)
    console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'} ${name}: ${message}`)
  }

  private async testDatabaseConnection(): Promise<void> {
    try {
      await prisma.$connect()
      const userCount = await prisma.user.count()
      const sourceCount = await prisma.newsSource.count()
      this.addResult('数据库连接', 'PASS', '连接成功', { userCount, sourceCount })
    } catch (error) {
      this.addResult('数据库连接', 'FAIL', `连接失败: ${error}`)
    }
  }

  private async testUserAuthentication(): Promise<void> {
    try {
      // 测试用户创建
      const testEmail = `test${Date.now()}@example.com`
      const emailToken = generateEmailToken()

      const user = await createUser({
        email: testEmail,
        password: 'TestPass123',
        name: '测试用户',
        emailToken
      })

      if (user.id && user.email === testEmail) {
        this.addResult('用户注册', 'PASS', '用户创建成功')
      } else {
        this.addResult('用户注册', 'FAIL', '用户创建失败')
      }

      // 测试用户查找
      const foundUser = await findUserByEmail(testEmail)
      if (foundUser && foundUser.id === user.id) {
        this.addResult('用户查找', 'PASS', '用户查找成功')
      } else {
        this.addResult('用户查找', 'FAIL', '用户查找失败')
      }

    } catch (error) {
      this.addResult('用户认证', 'FAIL', `认证测试失败: ${error}`)
    }
  }

  private async testNewsSources(): Promise<void> {
    try {
      const sources = await prisma.newsSource.findMany()
      if (sources.length > 0) {
        const activeCount = sources.filter(s => s.active).length
        const types = [...new Set(sources.map(s => s.type))]
        this.addResult('新闻源', 'PASS', `找到${sources.length}个源，${activeCount}个活跃，类型: ${types.join(', ')}`)
      } else {
        this.addResult('新闻源', 'FAIL', '没有找到新闻源')
      }
    } catch (error) {
      this.addResult('新闻源', 'FAIL', `新闻源测试失败: ${error}`)
    }
  }

  private async testNewsCollection(): Promise<void> {
    try {
      const manager = NewsCollectorManager.getInstance()

      // 获取一个活跃的新闻源进行测试
      const testSource = await prisma.newsSource.findFirst({
        where: { active: true }
      })

      if (!testSource) {
        this.addResult('新闻收集', 'SKIP', '没有活跃的新闻源可供测试')
        return
      }

      console.log(`测试收集新闻从: ${testSource.name}`)
      const collectedCount = await manager.collectFromSource(testSource.id)

      if (collectedCount >= 0) {
        this.addResult('新闻收集', 'PASS', `成功收集${collectedCount}条新闻`)
      } else {
        this.addResult('新闻收集', 'FAIL', '新闻收集失败')
      }

    } catch (error) {
      this.addResult('新闻收集', 'FAIL', `新闻收集测试失败: ${error}`)
    }
  }

  private async testGeminiAI(): Promise<void> {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
        this.addResult('Gemini AI', 'SKIP', 'GEMINI_API_KEY 未配置，跳过测试')
        return
      }

      const testNews = {
        title: '测试新闻标题',
        content: '这是一个测试新闻的内容，用于验证Gemini AI处理功能是否正常工作。',
        url: 'https://example.com/test-news',
        author: '测试作者',
        publishedAt: new Date()
      }

      const processed = await geminiProcessor.processNews(testNews)

      if (processed.summary && processed.category) {
        this.addResult('Gemini AI', 'PASS', 'AI处理成功', {
          category: processed.category,
          summaryLength: processed.summary.length
        })
      } else {
        this.addResult('Gemini AI', 'FAIL', 'AI处理结果不完整')
      }

    } catch (error) {
      this.addResult('Gemini AI', 'FAIL', `Gemini AI测试失败: ${error}`)
    }
  }

  private async testEmailService(): Promise<void> {
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key') {
        this.addResult('邮件服务', 'SKIP', 'RESEND_API_KEY 未配置，跳过测试')
        return
      }

      // 获取一个测试用户
      const testUser = await prisma.user.findFirst()
      if (!testUser) {
        this.addResult('邮件服务', 'SKIP', '没有测试用户，跳过邮件测试')
        return
      }

      const emailSent = await emailService.sendTestEmail(testUser.id)

      if (emailSent) {
        this.addResult('邮件服务', 'PASS', '测试邮件发送成功')
      } else {
        this.addResult('邮件服务', 'FAIL', '测试邮件发送失败')
      }

    } catch (error) {
      this.addResult('邮件服务', 'FAIL', `邮件服务测试失败: ${error}`)
    }
  }

  private async testScheduler(): Promise<void> {
    try {
      const tasks = taskScheduler.getTaskStatus()

      if (tasks.length > 0) {
        const enabledCount = tasks.filter(t => t.enabled).length
        this.addResult('定时任务', 'PASS', `找到${tasks.length}个任务，${enabledCount}个已启用`,
          tasks.map(t => ({ name: t.name, enabled: t.enabled, schedule: t.schedule }))
        )
      } else {
        this.addResult('定时任务', 'FAIL', '没有找到定时任务')
      }

    } catch (error) {
      this.addResult('定时任务', 'FAIL', `定时任务测试失败: ${error}`)
    }
  }

  private async testAPIStructure(): Promise<void> {
    try {
      // 检查API文件是否存在
      const fs = require('fs')
      const path = require('path')

      const apiPaths = [
        'app/api/auth/register/route.ts',
        'app/api/auth/login/route.ts',
        'app/api/news/sources/route.ts',
        'app/api/news/articles/route.ts',
        'app/api/ai/process/route.ts',
        'app/api/user/settings/route.ts',
        'app/api/email/send-test/route.ts'
      ]

      let existingCount = 0
      const missingPaths: string[] = []

      apiPaths.forEach(apiPath => {
        const fullPath = path.join(process.cwd(), apiPath)
        if (fs.existsSync(fullPath)) {
          existingCount++
        } else {
          missingPaths.push(apiPath)
        }
      })

      if (existingCount === apiPaths.length) {
        this.addResult('API结构', 'PASS', `所有${apiPaths.length}个API端点都存在`)
      } else {
        this.addResult('API结构', 'FAIL', `缺少${missingPaths.length}个API端点`, { missing: missingPaths })
      }

    } catch (error) {
      this.addResult('API结构', 'FAIL', `API结构测试失败: ${error}`)
    }
  }

  private async testEnvironmentVariables(): Promise<void> {
    try {
      const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_URL']
      const optionalEnvs = ['GEMINI_API_KEY', 'RESEND_API_KEY', 'FROM_EMAIL']

      const missingRequired: string[] = []
      const missingOptional: string[] = []

      requiredEnvs.forEach(env => {
        if (!process.env[env]) {
          missingRequired.push(env)
        }
      })

      optionalEnvs.forEach(env => {
        if (!process.env[env] || process.env[env] === `your-${env.toLowerCase().replace('_', '-')}-key` || process.env[env] === 'noreply@yourdomain.com') {
          missingOptional.push(env)
        }
      })

      if (missingRequired.length === 0) {
        if (missingOptional.length === 0) {
          this.addResult('环境变量', 'PASS', '所有必需和可选环境变量都已配置')
        } else {
          this.addResult('环境变量', 'PASS', `必需变量完整，${missingOptional.length}个可选变量未配置`, { missingOptional })
        }
      } else {
        this.addResult('环境变量', 'FAIL', `缺少${missingRequired.length}个必需环境变量`, { missingRequired, missingOptional })
      }

    } catch (error) {
      this.addResult('环境变量', 'FAIL', `环境变量测试失败: ${error}`)
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 开始 NewsHub 系统全面测试...\n')

    // 运行所有测试
    await this.testDatabaseConnection()
    await this.testEnvironmentVariables()
    await this.testUserAuthentication()
    await this.testNewsSources()
    await this.testNewsCollection()
    await this.testGeminiAI()
    await this.testEmailService()
    await this.testScheduler()
    await this.testAPIStructure()

    // 生成测试报告
    this.generateReport()
  }

  private generateReport(): void {
    console.log('\n📊 测试报告')
    console.log('='.repeat(50))

    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const skipped = this.results.filter(r => r.status === 'SKIP').length
    const total = this.results.length

    console.log(`总计: ${total}, 通过: ${passed}, 失败: ${failed}, 跳过: ${skipped}`)
    console.log(`成功率: ${Math.round((passed / total) * 100)}%`)

    console.log('\n详细结果:')
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️'
      console.log(`${icon} ${result.name}: ${result.message}`)

      if (result.status === 'FAIL' && result.details) {
        console.log(`   详情:`, result.details)
      }
    })

    if (failed > 0) {
      console.log('\n❌ 存在失败的测试项，请检查相关功能')
      process.exit(1)
    } else {
      console.log('\n✅ 所有测试通过！系统功能完整')
    }
  }

  async cleanup(): Promise<void> {
    try {
      await prisma.$disconnect()
      console.log('\n🧹 测试清理完成')
    } catch (error) {
      console.error('清理过程中发生错误:', error)
    }
  }
}

async function runFullSystemTest() {
  const tester = new SystemTest()

  try {
    await tester.runAllTests()
  } catch (error) {
    console.error('测试过程中发生错误:', error)
    process.exit(1)
  } finally {
    await tester.cleanup()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runFullSystemTest()
}

export { SystemTest }