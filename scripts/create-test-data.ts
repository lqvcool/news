import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('开始创建测试数据...');

  // 创建测试新闻
  const testNews = [
    {
      title: '人工智能技术取得重大突破：新算法显著提升学习效率',
      summary: '研究人员开发出一种新的机器学习算法，能够在更短的时间内完成模型训练，同时保持更高的准确性。这一突破有望加速AI在各个领域的应用。',
      content: '据最新研究报道，来自顶尖人工智能实验室的研究团队今日宣布，他们成功开发出一种革命性的机器学习算法。该算法通过优化神经网络的结构和训练过程，能够将传统需要数周的训练时间缩短至几天，同时模型的准确性和稳定性都有显著提升。专家表示，这一技术突破将推动人工智能在医疗诊断、自动驾驶、金融风控等关键领域的广泛应用。',
      url: 'https://example.com/news/ai-breakthrough',
      source: '新浪新闻',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      sentiment: 0.8,
      importance: 9,
      keywords: ['人工智能', '机器学习', '算法', '技术突破'],
      readTime: 3,
    },
    {
      title: '全球气候峰会达成历史性协议：2030年碳排放减少目标',
      summary: '在为期两周的激烈谈判后，参与国就碳排放减少达成一致，承诺到2030年将碳排放量比2020年水平减少45%。',
      content: '联合国气候大会在经过两周的紧张谈判后终于达成历史性协议。195个参与国一致同意，到2030年将全球碳排放量比2020年水平减少45%。这是迄今为止最雄心勃勃的气候行动计划。协议还包括发达国家向发展中国家提供气候资金支持的具体措施，以及加速可再生能源发展的国际合作框架。',
      url: 'https://example.com/news/climate-summit',
      source: 'BBC News',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
      sentiment: 0.6,
      importance: 8,
      keywords: ['气候变化', '碳排放', '环境保护', '国际合作'],
      readTime: 4,
    },
    {
      title: '科技巨头发布最新季度财报：业绩超预期增长',
      summary: '多家科技公司在最新季度财报中表现出色，营收和利润均超过分析师预期，推动股价上涨。',
      content: '科技行业的几家主要公司今日发布了最新季度财报，业绩表现强劲。其中，云计算业务增长显著，人工智能相关产品收入大幅提升。分析师认为，这反映了数字化转型的加速和企业对AI技术需求的快速增长。投资者对科技股的信心也随之增强，多家公司股价在盘后交易中上涨。',
      url: 'https://example.com/news/tech-earnings',
      source: '腾讯新闻',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
      sentiment: 0.4,
      importance: 7,
      keywords: ['科技', '财报', '股价', '云计算'],
      readTime: 3,
    },
    {
      title: '医疗研究新发现：基因编辑技术成功治疗罕见疾病',
      summary: '研究团队使用CRISPR基因编辑技术成功治疗了一名患有罕见遗传病的患者，为基因医学开辟了新的可能性。',
      content: '医学研究团队今日宣布了一项突破性进展：使用CRISPR-Cas9基因编辑技术成功治疗了一名患有严重遗传病的患者。这是基因编辑技术在临床应用中的重要里程碑。患者在接受治疗后，症状得到显著改善，生活质量大幅提升。研究人员表示，这一成功案例为治疗更多遗传性疾病带来了希望。',
      url: 'https://example.com/news/gene-therapy',
      source: '知乎热榜',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8小时前
      sentiment: 0.9,
      importance: 9,
      keywords: ['基因编辑', '医疗', 'CRISPR', '罕见病'],
      readTime: 5,
    },
    {
      title: '新能源汽车销量创新高：电动车市场份额持续增长',
      summary: '最新数据显示，全球新能源汽车销量同比增长35%，电动车在汽车市场中的占比达到历史新高。',
      content: '根据最新发布的汽车行业数据，新能源汽车销量在过去一年中实现了显著增长，同比增长率达到35%。其中，纯电动汽车的销量增长最为迅猛，市场份额从去年的8%提升至12%。专家分析，电池技术的改进、充电基础设施的完善以及各国政府的政策支持是推动这一增长的主要因素。预计在未来几年，新能源汽车的市场份额还将继续扩大。',
      url: 'https://example.com/news/electric-vehicles',
      source: '百度热榜',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10小时前
      sentiment: 0.5,
      importance: 6,
      keywords: ['新能源汽车', '电动车', '汽车市场', '销量'],
      readTime: 3,
    },
    {
      title: '教育改革新政策：全国推广数字化教学模式',
      summary: '教育部宣布将在全国范围内推广数字化教学模式，加强在线教育基础设施建设，提升教育质量和可及性。',
      content: '教育部今日发布重要政策文件，宣布将在全国范围内全面推进教育数字化转型。新政策包括加强学校网络基础设施建设，开发高质量的数字化教学资源，培训教师掌握现代教育技术。这一举措旨在缩小城乡教育差距，提高教育资源的可及性，培养学生的数字素养。政策预计将在未来三年内分阶段实施。',
      url: 'https://example.com/news/education-reform',
      source: '网易新闻',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12小时前
      sentiment: 0.3,
      importance: 7,
      keywords: ['教育', '数字化', '在线教育', '政策改革'],
      readTime: 4,
    },
    {
      title: '国际体育赛事：中国队在重要比赛中获得优异成绩',
      summary: '在国际体育赛事中，中国运动员表现出色，在多个项目中获得奖牌，为国家赢得荣誉。',
      content: '在今日结束的国际体育赛事中，中国代表团取得了令人瞩目的成绩。运动员们在游泳、田径、体操等多个项目中发挥出色，共获得金牌15枚、银牌12枚、铜牌8枚。这些成绩不仅展现了中国体育事业的蓬勃发展，也激励了更多年轻人参与体育运动。国家体育总局表示，将继续支持体育事业发展，培养更多优秀运动员。',
      url: 'https://example.com/news/sports-achievement',
      source: '微博热搜',
      publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14小时前
      sentiment: 0.8,
      importance: 5,
      keywords: ['体育', '比赛', '中国队', '奖牌'],
      readTime: 2,
    },
    {
      title: '房地产市场调控政策出台：促进市场健康发展',
      summary: '政府发布新的房地产市场调控政策，旨在稳定房价，保障居民住房需求，促进房地产市场长期健康发展。',
      content: '住房和城乡建设部今日联合多部门发布房地产市场调控新政策。政策包括优化土地供应、完善住房保障体系、规范市场秩序等多项措施。专家表示，这些政策将有助于抑制投机性购房需求，支持刚性住房需求，促进房地产市场平稳健康发展。政策实施后，预计房地产市场将逐步回归理性。',
      url: 'https://example.com/news/real-estate-policy',
      source: '凤凰新闻',
      publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16小时前
      sentiment: -0.2,
      importance: 8,
      keywords: ['房地产', '调控政策', '房价', '住房保障'],
      readTime: 4,
    },
  ];

  try {
    // 删除现有的测试数据（如果存在）
    await prisma.newsArticle.deleteMany({
      where: {
        sourceId: {
          in: testNews.map(n => n.source)
        }
      }
    });

    // 创建新的测试数据
    for (const news of testNews) {
      const newsData = {
        title: news.title,
        summary: news.summary,
        content: news.content,
        url: news.url,
        sourceId: news.source,
        publishedAt: news.publishedAt,
        sentiment: news.sentiment,
        importance: news.importance,
        keywords: JSON.stringify(news.keywords),
        readTime: news.readTime,
        hash: require('crypto').createHash('sha256').update(`${news.title}${news.url}`).digest('hex'),
      };
      await prisma.newsArticle.create({
        data: newsData,
      });
    }

    console.log(`✓ 成功创建 ${testNews.length} 条测试新闻`);

    // 验证数据
    const totalArticles = await prisma.newsArticle.count();
    console.log(`✓ 数据库中现有 ${totalArticles} 条新闻记录`);

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData().catch(console.error);