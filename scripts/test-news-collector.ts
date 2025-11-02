import { NewsCollectorManager } from '../lib/news-collector'
import { prisma } from '../lib/prisma'

async function testNewsCollector() {
  console.log('开始测试新闻收集功能...')

  try {
    // 检查数据库连接
    await prisma.$connect()
    console.log('✓ 数据库连接成功')

    // 检查新闻源
    const sourcesCount = await prisma.newsSource.count()
    console.log(`✓ 找到 ${sourcesCount} 个新闻源`)

    if (sourcesCount === 0) {
      console.log('⚠️  没有找到新闻源，请先运行 npm run db:seed')
      return
    }

    // 获取活跃的新闻源
    const activeSources = await prisma.newsSource.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        type: true,
        url: true
      }
    })

    console.log(`✓ 找到 ${activeSources.length} 个活跃的新闻源`)

    // 测试收集器管理器
    const manager = NewsCollectorManager.getInstance()

    // 测试从单个源收集新闻
    if (activeSources.length > 0) {
      const testSource = activeSources[0]
      console.log(`\n测试从 ${testSource.name} 收集新闻...`)

      try {
        const count = await manager.collectFromSource(testSource.id)
        console.log(`✓ 从 ${testSource.name} 收集了 ${count} 条新闻`)
      } catch (error) {
        console.error(`✗ 从 ${testSource.name} 收集新闻失败:`, error)
      }
    }

    // 测试获取最近新闻
    console.log('\n测试获取最近新闻...')
    const recentNews = await manager.getRecentNews(10)
    console.log(`✓ 获取到 ${recentNews.length} 条最近新闻`)

    if (recentNews.length > 0) {
      console.log('\n最新新闻示例:')
      recentNews.slice(0, 3).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`)
        console.log(`   来源: ${article.source.name}`)
        console.log(`   时间: ${article.publishedAt}`)
        console.log('')
      })
    }

    console.log('✓ 新闻收集功能测试完成')

  } catch (error) {
    console.error('✗ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testNewsCollector()
}

export { testNewsCollector }