import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from './prisma'
import crypto from 'crypto'

export interface NewsItem {
  title: string
  content?: string
  url: string
  author?: string
  publishedAt?: Date
  category?: string
  tags?: string[]
}

export interface NewsSource {
  id: string
  name: string
  url: string
  type: 'rss' | 'api' | 'scraper'
  category: string
  country: string
  active: boolean
}

export abstract class BaseCollector {
  protected source: NewsSource

  constructor(source: NewsSource) {
    this.source = source
  }

  abstract collect(): Promise<NewsItem[]>

  protected generateHash(item: NewsItem): string {
    const content = `${item.title}${item.url}${item.author || ''}`
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .trim()
  }

  protected extractDate(dateString?: string): Date | undefined {
    if (!dateString) return undefined

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return undefined
      return date
    } catch {
      return undefined
    }
  }
}

// RSS收集器
export class RSSCollector extends BaseCollector {
  async collect(): Promise<NewsItem[]> {
    try {
      const response = await axios.get(this.source.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'NewsHub/1.0 (+https://newshub.example.com)'
        }
      })

      const $ = cheerio.load(response.data, { xmlMode: true })
      const items: NewsItem[] = []

      $('item, entry').each((_: any, element: any) => {
        const $el = $(element)

        const title = this.cleanText($el.find('title').text() || $el.find('title').text())
        const link = $el.find('link').attr('href') || $el.find('link').text()
        const description = this.cleanText($el.find('description').text() || $el.find('summary').text())
        const author = this.cleanText($el.find('author').text() || $el.find('creator').text())
        const pubDate = $el.find('pubDate').text() || $el.find('published').text()

        if (title && link) {
          items.push({
            title,
            content: description,
            url: link,
            author: author || undefined,
            publishedAt: this.extractDate(pubDate),
            category: this.source.category,
            tags: [this.source.category]
          })
        }
      })

      return items
    } catch (error) {
      console.error(`RSS收集错误 ${this.source.name}:`, error)
      return []
    }
  }
}

// 网页爬虫收集器
export class ScraperCollector extends BaseCollector {
  async collect(): Promise<NewsItem[]> {
    try {
      const response = await axios.get(this.source.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'NewsHub/1.0 (+https://newshub.example.com)'
        }
      })

      const cheerioAPI = cheerio.load(response.data)
      const items: NewsItem[] = []

      // 根据不同网站的结构提取新闻
      switch (this.source.name) {
        case '微博热搜':
          items.push(...this.extractWeiboHot(cheerioAPI))
          break
        case '知乎热榜':
          items.push(...this.extractZhihuHot(cheerioAPI))
          break
        case '百度热榜':
          items.push(...this.extractBaiduHot(cheerioAPI))
          break
        case '新浪新闻':
          items.push(...this.extractSinaNews(cheerioAPI))
          break
        default:
          // 通用提取逻辑
          items.push(...this.extractGenericNews(cheerioAPI))
      }

      return items
    } catch (error) {
      console.error(`爬虫收集错误 ${this.source.name}:`, error)
      return []
    }
  }

  private extractWeiboHot($: any): NewsItem[] {
    const items: NewsItem[] = []

    $('#pl_top_realtimehot table tbody tr').each((_: any, element: any) => {
      const $el = $(element)
      const title = $el.find('td a').text().trim()
      const link = $el.find('td a').attr('href')
      const hot = $el.find('td span').text().trim()

      if (title && link) {
        items.push({
          title: `${title} ${hot ? `(${hot})` : ''}`,
          url: link.startsWith('http') ? link : `https://s.weibo.com${link}`,
          category: 'social',
          tags: ['微博', '热搜']
        })
      }
    })

    return items
  }

  private extractZhihuHot($: any): NewsItem[] {
    const items: NewsItem[] = []

    $('.HotList-item').each((_: any, element: any) => {
      const $el = $(element)
      const title = $el.find('.HotList-itemTitle').text().trim()
      const link = $el.find('a').attr('href')
      const excerpt = $el.find('.HotList-itemExcerpt').text().trim()

      if (title && link) {
        items.push({
          title,
          content: excerpt,
          url: link.startsWith('http') ? link : `https://www.zhihu.com${link}`,
          category: 'social',
          tags: ['知乎', '热榜']
        })
      }
    })

    return items
  }

  private extractBaiduHot($: any): NewsItem[] {
    const items: NewsItem[] = []

    $('.c-container').each((_: any, element: any) => {
      const $el = $(element)
      const title = $el.find('.c-title').text().trim()
      const link = $el.find('a').attr('href')

      if (title && link) {
        items.push({
          title,
          url: link,
          category: 'general',
          tags: ['百度', '热榜']
        })
      }
    })

    return items
  }

  private extractSinaNews($: any): NewsItem[] {
    const items: NewsItem[] = []

    $('.news-item').each((_: any, element: any) => {
      const $el = $(element)
      const title = $el.find('h1, .title').text().trim()
      const link = $el.find('a').attr('href')
      const summary = $el.find('.summary, .content').text().trim()

      if (title && link) {
        items.push({
          title,
          content: summary,
          url: link.startsWith('http') ? link : `https://news.sina.com.cn${link}`,
          category: 'general',
          tags: ['新浪', '新闻']
        })
      }
    })

    return items
  }

  private extractGenericNews($: any): NewsItem[] {
    const items: NewsItem[] = []

    // 通用新闻提取逻辑
    $('article, .news-article, .post, .item').each((_: any, element: any) => {
      const $el = $(element)
      const title = $el.find('h1, h2, h3, .title, .headline').first().text().trim()
      const link = $el.find('a').first().attr('href')
      const content = $el.find('.content, .summary, .excerpt').first().text().trim()

      if (title && link) {
        items.push({
          title,
          content,
          url: link.startsWith('http') ? link : new URL(link, this.source.url).href,
          category: this.source.category,
          tags: [this.source.name]
        })
      }
    })

    return items
  }
}

// API收集器（用于需要API调用的数据源）
export class APICollector extends BaseCollector {
  async collect(): Promise<NewsItem[]> {
    try {
      // 这里可以扩展实现各种API调用
      // 比如Twitter API、Reddit API等
      console.log(`API收集器 ${this.source.name} 暂未实现`)
      return []
    } catch (error) {
      console.error(`API收集错误 ${this.source.name}:`, error)
      return []
    }
  }
}

// 新闻收集管理器
export class NewsCollectorManager {
  private static instance: NewsCollectorManager
  private collectors: Map<string, BaseCollector> = new Map()

  private constructor() {}

  static getInstance(): NewsCollectorManager {
    if (!NewsCollectorManager.instance) {
      NewsCollectorManager.instance = new NewsCollectorManager()
    }
    return NewsCollectorManager.instance
  }

  private createCollector(source: NewsSource): BaseCollector {
    switch (source.type) {
      case 'rss':
        return new RSSCollector(source)
      case 'scraper':
        return new ScraperCollector(source)
      case 'api':
        return new APICollector(source)
      default:
        throw new Error(`未知的收集器类型: ${source.type}`)
    }
  }

  async collectFromSource(sourceId: string): Promise<number> {
    const source = await prisma.newsSource.findUnique({
      where: { id: sourceId }
    })

    if (!source || !source.active) {
      return 0
    }

    let collector = this.collectors.get(sourceId)
    if (!collector) {
      // 转换 Prisma 对象到 NewsSource 接口
      const newsSource: NewsSource = {
        id: source.id,
        name: source.name,
        url: source.url,
        type: source.type as 'rss' | 'api' | 'scraper',
        category: source.category,
        country: source.country,
        active: source.active
      }
      collector = this.createCollector(newsSource)
      this.collectors.set(sourceId, collector)
    }

    try {
      const newsItems = await collector.collect()
      let savedCount = 0

      for (const item of newsItems) {
        const hash = crypto.createHash('sha256').update(`${item.title}${item.url}`).digest('hex')

        try {
          await prisma.newsArticle.create({
            data: {
              sourceId: source.id,
              title: item.title,
              content: item.content,
              url: item.url,
              author: item.author,
              publishedAt: item.publishedAt || new Date(),
              category: item.category,
              tags: JSON.stringify(item.tags || []),
              hash
            }
          })
          savedCount++
        } catch (error: any) {
          // 忽略重复项错误
          if (error.code !== 'P2002') {
            console.error(`保存新闻失败:`, error)
          }
        }
      }

      console.log(`从 ${source.name} 收集到 ${newsItems.length} 条新闻，保存了 ${savedCount} 条`)
      return savedCount

    } catch (error) {
      console.error(`收集新闻失败 ${source.name}:`, error)
      return 0
    }
  }

  async collectFromAllActiveSources(): Promise<number> {
    const sources = await prisma.newsSource.findMany({
      where: { active: true }
    })

    let totalCollected = 0

    for (const source of sources) {
      try {
        const count = await this.collectFromSource(source.id)
        totalCollected += count
      } catch (error) {
        console.error(`从源 ${source.name} 收集新闻失败:`, error)
      }
    }

    console.log(`总共收集了 ${totalCollected} 条新闻`)
    return totalCollected
  }

  async getRecentNews(limit: number = 50, category?: string): Promise<any[]> {
    const where: any = {}

    if (category) {
      where.category = category
    }

    return await prisma.newsArticle.findMany({
      where,
      include: {
        source: {
          select: {
            name: true,
            country: true
          }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit
    })
  }
}