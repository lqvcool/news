import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { prisma } from './prisma'

// 初始化Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// 安全配置
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  }
]

export interface ProcessedNews {
  id: string
  originalTitle: string
  processedTitle?: string
  summary: string
  category: string
  sentiment: 'positive' | 'negative' | 'neutral'
  keywords: string[]
  importanceScore: number
  readingTime: number
}

export interface NewsDigest {
  title: string
  summary: string
  categories: {
    name: string
    articles: number
    highlights: string[]
  }[]
  trendingTopics: string[]
  sentiment: {
    positive: number
    negative: number
    neutral: number
  }
}

export class GeminiProcessor {
  private model: any

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings
    })
  }

  // 处理单条新闻
  async processNews(article: {
    title: string
    content?: string
    url: string
    author?: string
    publishedAt?: Date
  }): Promise<ProcessedNews> {
    const prompt = `
请分析以下新闻内容，并以JSON格式返回结果：

新闻标题：${article.title}
新闻内容：${article.content || '无内容'}
作者：${article.author || '未知'}
发布时间：${article.publishedAt || '未知'}

请提供以下信息：
{
  "processedTitle": "优化后的标题（保持原意但更吸引人）",
  "summary": "新闻摘要（100字以内）",
  "category": "新闻分类（如：政治、经济、科技、娱乐、体育、社会、国际等）",
  "sentiment": "情感倾向（positive/negative/neutral）",
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "importanceScore": 0.8,
  "readingTime": 3
}

要求：
1. processedTitle应该简洁有力，保持新闻准确性
2. summary应该概括新闻核心内容
3. category选择最合适的分类
4. sentiment基于新闻内容的整体情感倾向
5. keywords提取最重要的5个关键词
6. importanceScore范围0-1，表示新闻重要性
7. readingTime估算阅读时间（分钟）
`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // 提取JSON部分
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无法解析AI响应')
      }

      const processed = JSON.parse(jsonMatch[0])

      return {
        id: '', // 由调用方设置
        originalTitle: article.title,
        processedTitle: processed.processedTitle,
        summary: processed.summary,
        category: processed.category,
        sentiment: processed.sentiment,
        keywords: processed.keywords,
        importanceScore: processed.importanceScore,
        readingTime: processed.readingTime
      }
    } catch (error) {
      console.error('处理新闻失败:', error)

      // 返回默认处理结果
      return {
        id: '',
        originalTitle: article.title,
        processedTitle: article.title,
        summary: article.content?.substring(0, 100) || '无摘要',
        category: '未分类',
        sentiment: 'neutral',
        keywords: [],
        importanceScore: 0.5,
        readingTime: 2
      }
    }
  }

  // 生成新闻摘要
  async generateDigest(articles: ProcessedNews[]): Promise<NewsDigest> {
    if (articles.length === 0) {
      return this.createEmptyDigest()
    }

    // 按分类整理新闻
    const categories = this.groupByCategory(articles)

    const prompt = `
基于以下新闻列表，生成一份今日新闻摘要：

${this.formatArticlesForPrompt(articles)}

请以JSON格式返回：
{
  "title": "今日新闻摘要标题",
  "summary": "整体摘要（200字以内）",
  "categories": [
    {
      "name": "分类名称",
      "articles": 数量,
      "highlights": ["该分类下2-3个重要新闻的摘要"]
    }
  ],
  "trendingTopics": ["热点话题1", "热点话题2", "热点话题3"],
  "sentiment": {
    "positive": 百分比,
    "negative": 百分比,
    "neutral": 百分比
  }
}

要求：
1. title要吸引人且反映今日新闻重点
2. summary概括今日重要新闻
3. categories按重要性排序，highlights选择最重要的新闻
4. trendingTopics提取今日热点话题
5. sentiment基于所有新闻的情感分析
`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无法解析AI响应')
      }

      const digest = JSON.parse(jsonMatch[0])
      return digest
    } catch (error) {
      console.error('生成新闻摘要失败:', error)
      return this.createFallbackDigest(articles)
    }
  }

  // 个性化推荐
  async getPersonalizedRecommendations(
    userPreferences: {
      categories: string[]
      keywords: string[]
      readingTime: number
    },
    articles: ProcessedNews[]
  ): Promise<ProcessedNews[]> {
    if (articles.length === 0) {
      return []
    }

    const prompt = `
根据用户偏好筛选和排序以下新闻：

用户偏好：
- 喜欢的分类：${userPreferences.categories.join(', ')}
- 关键词：${userPreferences.keywords.join(', ')}
- 偏好阅读时间：${userPreferences.readingTime}分钟

新闻列表：
${this.formatArticlesForPrompt(articles)}

请返回推荐新闻的ID列表（按推荐度排序）：
["id1", "id2", "id3", ...]

要求：
1. 优先选择用户喜欢的分类
2. 考虑用户关注的关键词
3. 控制阅读时间在用户偏好范围内
4. 按重要性和相关性排序
`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const idMatch = text.match(/\[[\s\S]*?\]/)
      if (!idMatch) {
        return articles.slice(0, 10) // 返回前10条作为默认
      }

      const recommendedIds = JSON.parse(idMatch[0])
      const idMap = new Map(articles.map(article => [article.id, article]))

      return recommendedIds
        .filter((id: string) => idMap.has(id))
        .map((id: string) => idMap.get(id))
    } catch (error) {
      console.error('生成个性化推荐失败:', error)
      return articles.slice(0, 10)
    }
  }

  private groupByCategory(articles: ProcessedNews[]): Map<string, ProcessedNews[]> {
    const groups = new Map<string, ProcessedNews[]>()

    articles.forEach(article => {
      const category = article.category
      if (!groups.has(category)) {
        groups.set(category, [])
      }
      groups.get(category)!.push(article)
    })

    return groups
  }

  private formatArticlesForPrompt(articles: ProcessedNews[]): string {
    return articles
      .slice(0, 20) // 限制数量避免超出token限制
      .map((article, index) =>
        `${index + 1}. 标题：${article.originalTitle}\n   摘要：${article.summary}\n   分类：${article.category}\n   重要性：${article.importanceScore}`
      )
      .join('\n\n')
  }

  private createEmptyDigest(): NewsDigest {
    return {
      title: '今日新闻摘要',
      summary: '暂无新闻内容',
      categories: [],
      trendingTopics: [],
      sentiment: { positive: 0, negative: 0, neutral: 100 }
    }
  }

  private createFallbackDigest(articles: ProcessedNews[]): NewsDigest {
    const categories = this.groupByCategory(articles)
    const sentiment = this.calculateSentiment(articles)

    return {
      title: '今日新闻摘要',
      summary: `今日共收集到${articles.length}条新闻`,
      categories: Array.from(categories.entries()).map(([name, items]) => ({
        name,
        articles: items.length,
        highlights: items.slice(0, 3).map(item => item.summary)
      })),
      trendingTopics: this.extractTopKeywords(articles),
      sentiment
    }
  }

  private calculateSentiment(articles: ProcessedNews[]) {
    const total = articles.length
    const counts = {
      positive: articles.filter(a => a.sentiment === 'positive').length,
      negative: articles.filter(a => a.sentiment === 'negative').length,
      neutral: articles.filter(a => a.sentiment === 'neutral').length
    }

    return {
      positive: Math.round((counts.positive / total) * 100),
      negative: Math.round((counts.negative / total) * 100),
      neutral: Math.round((counts.neutral / total) * 100)
    }
  }

  private extractTopKeywords(articles: ProcessedNews[]): string[] {
    const keywordCount = new Map<string, number>()

    articles.forEach(article => {
      article.keywords.forEach(keyword => {
        keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1)
      })
    })

    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword)
  }
}

// 导出单例实例
export const geminiProcessor = new GeminiProcessor()