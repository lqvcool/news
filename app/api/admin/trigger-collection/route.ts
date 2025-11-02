import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { findUserById, prisma } from '@/lib/auth'

// 模拟新闻收集状态（实际项目中应该使用任务队列或状态管理）
let collectionStatus: 'idle' | 'running' | 'error' = 'idle'
let lastCollectionTime: Date | null = null

async function handleTriggerCollection(request: AuthenticatedRequest) {
  try {
    const user = await findUserById(request.user!.userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 检查是否为管理员
    if (user.email !== 'lqvcool@163.com' && user.id !== '1') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 检查是否已经在运行中
    if (collectionStatus === 'running') {
      return NextResponse.json({
        success: false,
        message: '新闻收集任务已在运行中',
        status: collectionStatus
      }, { status: 409 })
    }

    // 更新状态为运行中
    collectionStatus = 'running'
    lastCollectionTime = new Date()

    // 模拟新闻收集过程（实际项目中这里会调用新闻收集服务）
    const collectNews = async () => {
      try {
        // 模拟从不同源收集新闻
        const newsSources = [
          { name: 'RSS源', count: Math.floor(Math.random() * 20) + 10 },
          { name: 'API源', count: Math.floor(Math.random() * 15) + 8 },
          { name: '网页抓取', count: Math.floor(Math.random() * 10) + 5 }
        ]

        let totalCollected = 0
        const collectionDetails = []

        for (const source of newsSources) {
          // 模拟收集延迟
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

          totalCollected += source.count
          collectionDetails.push({
            source: source.name,
            collected: source.count,
            status: 'success'
          })
        }

        // 模拟AI处理
        await new Promise(resolve => setTimeout(resolve, 2000))

        // 模拟数据库保存
        await new Promise(resolve => setTimeout(resolve, 1000))

        collectionStatus = 'idle'

        return {
          success: true,
          totalCollected,
          details: collectionDetails,
          duration: Date.now() - lastCollectionTime!.getTime()
        }
      } catch (error) {
        console.error('News collection error:', error)
        collectionStatus = 'error'
        throw error
      }
    }

    // 异步启动新闻收集（不等待完成）
    collectNews().catch(error => {
      console.error('News collection failed:', error)
      collectionStatus = 'error'
    })

    return NextResponse.json({
      success: true,
      message: '新闻收集任务已启动',
      status: collectionStatus,
      startTime: lastCollectionTime.toISOString(),
      estimatedDuration: '30-60秒'
    })

  } catch (error) {
    console.error('Trigger collection error:', error)
    collectionStatus = 'error'

    return NextResponse.json({
      error: '启动新闻收集失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

async function handleGetCollectionStatus(request: AuthenticatedRequest) {
  try {
    const user = await findUserById(request.user!.userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 检查是否为管理员
    if (user.email !== 'lqvcool@163.com' && user.id !== '1') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 获取最近的收集记录
    const recentCollections = await prisma.newsArticle.findMany({
      select: {
        id: true,
        title: true,
        source: true,
        publishedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const stats = {
      totalNews: await prisma.newsArticle.count(),
      todayNews: await prisma.newsArticle.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      thisWeekNews: await prisma.newsArticle.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      status: collectionStatus,
      lastCollectionTime,
      stats,
      recentCollections: recentCollections.map(news => ({
        id: news.id,
        title: news.title.length > 50 ? news.title.substring(0, 50) + '...' : news.title,
        source: news.source,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt
      }))
    })

  } catch (error) {
    console.error('Get collection status error:', error)

    return NextResponse.json({
      error: '获取收集状态失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export const POST = (request: NextRequest) => withAuth(request, handleTriggerCollection)
export const GET = (request: NextRequest) => withAuth(request, handleGetCollectionStatus)