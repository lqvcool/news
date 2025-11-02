const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('开始创建测试数据...');

  const testNews = [
    {
      title: '人工智能技术取得重大突破：新算法显著提升学习效率',
      summary: '研究人员开发出一种新的机器学习算法，能够在更短的时间内完成模型训练，同时保持更高的准确性。',
      content: '据最新研究报道，来自顶尖人工智能实验室的研究团队今日宣布，他们成功开发出一种革命性的机器学习算法。',
      url: 'https://example.com/news/ai-breakthrough',
      source: '新浪新闻',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sentiment: 0.8,
      importance: 9,
      keywords: ['人工智能', '机器学习', '算法'],
      readTime: 3,
    },
    {
      title: '全球气候峰会达成历史性协议：2030年碳排放减少目标',
      summary: '在为期两周的激烈谈判后，参与国就碳排放减少达成一致，承诺到2030年将碳排放量比2020年水平减少45%。',
      content: '联合国气候大会在经过两周的紧张谈判后终于达成历史性协议。195个参与国一致同意，到2030年将全球碳排放量比2020年水平减少45%。',
      url: 'https://example.com/news/climate-summit',
      source: 'BBC News',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      sentiment: 0.6,
      importance: 8,
      keywords: ['气候变化', '碳排放', '环境保护'],
      readTime: 4,
    },
    {
      title: '科技巨头发布最新季度财报：业绩超预期增长',
      summary: '多家科技公司在最新季度财报中表现出色，营收和利润均超过分析师预期，推动股价上涨。',
      content: '科技行业的几家主要公司今日发布了最新季度财报，业绩表现强劲。其中，云计算业务增长显著。',
      url: 'https://example.com/news/tech-earnings',
      source: '腾讯新闻',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      sentiment: 0.4,
      importance: 7,
      keywords: ['科技', '财报', '股价'],
      readTime: 3,
    },
  ];

  try {
    // 删除现有的测试数据
    await prisma.article.deleteMany({});

    // 创建新的测试数据
    for (const news of testNews) {
      await prisma.article.create({
        data: news,
      });
    }

    console.log(`✓ 成功创建 ${testNews.length} 条测试新闻`);

    // 验证数据
    const totalArticles = await prisma.article.count();
    console.log(`✓ 数据库中现有 ${totalArticles} 条新闻记录`);

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData().catch(console.error);