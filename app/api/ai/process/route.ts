import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { geminiProcessor } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'

async function handleProcessNews(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { articleIds, limit = 10 } = body

    // 获取要处理的新闻
    const articles = await prisma.newsArticle.findMany({
      where: {
        id: articleIds ? { in: articleIds } : undefined,
        summary: null // 只处理未处理的新闻
      },
      include: {
        source: true
      },
      orderBy: { publishedAt: 'desc' },
      take: limit
    })

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: '没有需要处理的新闻',
          processedCount: 0
        }
      })
    }

    console.log(`开始处理 ${articles.length} 条新闻...`)

    // 使用Gemini处理新闻
    const processedArticles = []

    for (const article of articles) {
      try {
        const processed = await geminiProcessor.processNews({
          title: article.title,
          content: article.content || undefined,
          url: article.url,
          author: article.author || undefined,
          publishedAt: article.publishedAt
        })

        processed.id = article.id
        processedArticles.push(processed)

        // 更新数据库
        await prisma.newsArticle.update({
          where: { id: article.id },
          data: {
            summary: processed.summary,
            category: processed.category,
            tags: JSON.stringify(processed.keywords)
          }
        })

        console.log(`✓ 处理完成: ${article.title}`)
      } catch (error) {
        console.error(`✗ 处理失败: ${article.title}`, error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `成功处理 ${processedArticles.length} 条新闻`,
        processedCount: processedArticles.length,
        articles: processedArticles
      }
    })

  } catch (error) {
    console.error('AI处理新闻错误:', error)
    return NextResponse.json(
      { error: 'AI处理失败' },
      { status: 500 }
    )
  }
}

async function handleGenerateDigest(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { timeRange = '24h' } = body

    // 计算时间范围
    const now = new Date()
    let startTime: Date

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case '24h':
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
    }

    // 获取时间范围内的新闻
    const articles = await prisma.newsArticle.findMany({
      where: {
        publishedAt: {
          gte: startTime
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

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: '指定时间范围内没有新闻',
          digest: null
        }
      })
    }

    // 转换为ProcessedNews格式
    const processedArticles = articles.map(article => ({
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

    return NextResponse.json({
      success: true,
      data: {
        digest,
        articlesCount: articles.length,
        timeRange
      }
    })

  } catch (error) {
    console.error('生成新闻摘要错误:', error)
    return NextResponse.json(
      { error: '生成新闻摘要失败' },
      { status: 500 }
    )
  }
}

async function handleGetRecommendations(request: AuthenticatedRequest) {
  try {
    // 获取用户设置
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: request.user!.userId }
    })

    const defaultPreferences = {
      categories: ['科技', '经济', '社会'],
      keywords: [],
      readingTime: 5
    }

    const preferences = userSettings ? {
      categories: JSON.parse(userSettings.categoriesFilter || '[]').length > 0
        ? JSON.parse(userSettings.categoriesFilter)
        : defaultPreferences.categories,
      keywords: JSON.parse(userSettings.keywordsFilter || '[]'),
      readingTime: 5
    } : defaultPreferences

    // 获取最近的新闻
    const articles = await prisma.newsArticle.findMany({
      where: {
        summary: {
          not: null
        }
      },
      include: {
        source: true
      },
      orderBy: { publishedAt: 'desc' },
      take: 50
    })

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          recommendations: [],
          message: '暂无新闻推荐'
        }
      })
    }

    // 转换为ProcessedNews格式
    const processedArticles = articles.map(article => ({
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

    // 获取个性化推荐
    const recommendations = await geminiProcessor.getPersonalizedRecommendations(
      preferences,
      processedArticles
    )

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        preferences,
        totalArticles: articles.length
      }
    })

  } catch (error) {
    console.error('获取推荐错误:', error)
    return NextResponse.json(
      { error: '获取推荐失败' },
      { status: 500 }
    )
  }
}

export const POST = (request: NextRequest) => withAuth(request, handleProcessNews)
export const PUT = (request: NextRequest) => withAuth(request, handleGenerateDigest)
export const GET = (request: NextRequest) => withAuth(request, handleGetRecommendations)