import { NextRequest, NextResponse } from 'next/server'
import { NewsCollectorManager } from '@/lib/news-collector'

async function handleGetNews(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const sourceId = searchParams.get('sourceId')

    const manager = NewsCollectorManager.getInstance()
    const articles = await manager.getRecentNews(limit, category || undefined)

    // 过滤逻辑可以在数据库层面优化，这里简化处理
    let filteredArticles = articles

    if (sourceId) {
      filteredArticles = filteredArticles.filter(article => article.sourceId === sourceId)
    }

    // 分页处理
    const paginatedArticles = filteredArticles.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        articles: paginatedArticles,
        pagination: {
          total: filteredArticles.length,
          limit,
          offset,
          hasMore: offset + limit < filteredArticles.length
        }
      }
    })

  } catch (error) {
    console.error('Get news articles error:', error)
    return NextResponse.json(
      { error: '获取新闻失败' },
      { status: 500 }
    )
  }
}

async function handleRefreshNews(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceId } = body

    const manager = NewsCollectorManager.getInstance()

    let collectedCount: number

    if (sourceId) {
      collectedCount = await manager.collectFromSource(sourceId)
    } else {
      collectedCount = await manager.collectFromAllActiveSources()
    }

    return NextResponse.json({
      success: true,
      data: {
        collectedCount,
        message: `成功收集了 ${collectedCount} 条新闻`
      }
    })

  } catch (error) {
    console.error('Refresh news error:', error)
    return NextResponse.json(
      { error: '刷新新闻失败' },
      { status: 500 }
    )
  }
}

export const GET = handleGetNews
export const POST = handleRefreshNews