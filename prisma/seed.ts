import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const newsSources = [
  // 国内新闻源
  {
    name: '微博热搜',
    url: 'https://s.weibo.com/top/summary',
    type: 'scraper',
    category: 'social',
    country: 'CN'
  },
  {
    name: '新浪新闻',
    url: 'https://news.sina.com.cn/',
    type: 'scraper',
    category: 'general',
    country: 'CN'
  },
  {
    name: '知乎热榜',
    url: 'https://www.zhihu.com/hot',
    type: 'scraper',
    category: 'social',
    country: 'CN'
  },
  {
    name: '百度热榜',
    url: 'https://top.baidu.com/board?tab=realtime',
    type: 'scraper',
    category: 'general',
    country: 'CN'
  },
  {
    name: '今日头条',
    url: 'https://www.toutiao.com/',
    type: 'scraper',
    category: 'general',
    country: 'CN'
  },
  {
    name: '腾讯新闻',
    url: 'https://news.qq.com/',
    type: 'scraper',
    category: 'general',
    country: 'CN'
  },
  {
    name: '网易新闻',
    url: 'https://news.163.com/',
    type: 'scraper',
    category: 'general',
    country: 'CN'
  },
  {
    name: '凤凰新闻',
    url: 'https://news.ifeng.com/',
    type: 'scraper',
    category: 'general',
    country: 'CN'
  },

  // 国际新闻源
  {
    name: 'X/Twitter Trending',
    url: 'https://api.twitter.com/2/trends',
    type: 'api',
    category: 'social',
    country: 'US'
  },
  {
    name: 'Reddit Trending',
    url: 'https://www.reddit.com/hot.json',
    type: 'api',
    category: 'social',
    country: 'US'
  },
  {
    name: 'Google News',
    url: 'https://news.google.com/rss',
    type: 'rss',
    category: 'general',
    country: 'US'
  },
  {
    name: 'BBC News',
    url: 'http://feeds.bbci.co.uk/news/rss.xml',
    type: 'rss',
    category: 'general',
    country: 'UK'
  },
  {
    name: 'CNN News',
    url: 'http://rss.cnn.com/rss/edition.rss',
    type: 'rss',
    category: 'general',
    country: 'US'
  }
]

async function main() {
  console.log('开始初始化新闻源...')

  for (const source of newsSources) {
    await prisma.newsSource.upsert({
      where: { url: source.url },
      update: {},
      create: source
    })
  }

  console.log('新闻源初始化完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })