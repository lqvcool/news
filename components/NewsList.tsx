'use client';

import React, { useState, useEffect } from 'react';

// 定义文章类型
interface Article {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment?: number;
  importance?: number;
  keywords?: string[];
  readTime?: number;
}

interface NewsCardProps {
  article: Article;
}

function NewsCard({ article }: NewsCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600 bg-green-50';
    if (sentiment < -0.3) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getSentimentText = (sentiment: number) => {
    if (sentiment > 0.3) return '积极';
    if (sentiment < -0.3) return '消极';
    return '中性';
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'bg-red-500';
    if (importance >= 6) return 'bg-orange-500';
    if (importance >= 4) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {article.source}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded ${getSentimentColor(article.sentiment || 0)}`}>
              {getSentimentText(article.sentiment || 0)}
            </span>
            {article.importance && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">重要性:</span>
                <div className={`w-2 h-2 rounded-full ${getImportanceColor(article.importance)}`}></div>
                <span className="text-xs font-medium text-gray-700">{article.importance}/10</span>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              {article.title}
            </a>
          </h2>
        </div>
      </div>

      <p className="text-gray-600 mb-3 line-clamp-3">
        {article.summary || article.content?.substring(0, 200) + '...'}
      </p>

      {article.keywords && article.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {article.keywords.slice(0, 5).map((keyword, index) => (
            <span
              key={index}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{formatDate(article.publishedAt)}</span>
        {article.readTime && (
          <span>阅读时间: {article.readTime}分钟</span>
        )}
      </div>
    </div>
  );
}

export default function NewsList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');

  const sources = ['all', '新浪新闻', 'BBC News', '腾讯新闻', '知乎热榜', '百度热榜'];

  // 模拟数据
  const mockArticles: Article[] = [
    {
      id: '1',
      title: '人工智能技术取得重大突破：新算法显著提升学习效率',
      summary: '研究人员开发出一种新的机器学习算法，能够在更短的时间内完成模型训练，同时保持更高的准确性。这一突破有望加速AI在各个领域的应用。',
      content: '据最新研究报道，来自顶尖人工智能实验室的研究团队今日宣布，他们成功开发出一种革命性的机器学习算法。该算法通过优化神经网络的结构和训练过程，能够将传统需要数周的训练时间缩短至几天，同时模型的准确性和稳定性都有显著提升。',
      url: 'https://example.com/news/ai-breakthrough',
      source: '新浪新闻',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sentiment: 0.8,
      importance: 9,
      keywords: ['人工智能', '机器学习', '算法', '技术突破'],
      readTime: 3,
    },
    {
      id: '2',
      title: '全球气候峰会达成历史性协议：2030年碳排放减少目标',
      summary: '在为期两周的激烈谈判后，参与国就碳排放减少达成一致，承诺到2030年将碳排放量比2020年水平减少45%。',
      content: '联合国气候大会在经过两周的紧张谈判后终于达成历史性协议。195个参与国一致同意，到2030年将全球碳排放量比2020年水平减少45%。这是迄今为止最雄心勃勃的气候行动计划。',
      url: 'https://example.com/news/climate-summit',
      source: 'BBC News',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      sentiment: 0.6,
      importance: 8,
      keywords: ['气候变化', '碳排放', '环境保护', '国际合作'],
      readTime: 4,
    },
    {
      id: '3',
      title: '科技巨头发布最新季度财报：业绩超预期增长',
      summary: '多家科技公司在最新季度财报中表现出色，营收和利润均超过分析师预期，推动股价上涨。',
      content: '科技行业的几家主要公司今日发布了最新季度财报，业绩表现强劲。其中，云计算业务增长显著，人工智能相关产品收入大幅提升。',
      url: 'https://example.com/news/tech-earnings',
      source: '腾讯新闻',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      sentiment: 0.4,
      importance: 7,
      keywords: ['科技', '财报', '股价', '云计算'],
      readTime: 3,
    },
    {
      id: '4',
      title: '医疗研究新发现：基因编辑技术成功治疗罕见疾病',
      summary: '研究团队使用CRISPR基因编辑技术成功治疗了一名患有罕见遗传病的患者，为基因医学开辟了新的可能性。',
      content: '医学研究团队今日宣布了一项突破性进展：使用CRISPR-Cas9基因编辑技术成功治疗了一名患有严重遗传病的患者。',
      url: 'https://example.com/news/gene-therapy',
      source: '知乎热榜',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      sentiment: 0.9,
      importance: 9,
      keywords: ['基因编辑', '医疗', 'CRISPR', '罕见病'],
      readTime: 5,
    },
    {
      id: '5',
      title: '新能源汽车销量创新高：电动车市场份额持续增长',
      summary: '最新数据显示，全球新能源汽车销量同比增长35%，电动车在汽车市场中的占比达到历史新高。',
      content: '根据最新发布的汽车行业数据，新能源汽车销量在过去一年中实现了显著增长，同比增长率达到35%。',
      url: 'https://example.com/news/electric-vehicles',
      source: '百度热榜',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      sentiment: 0.5,
      importance: 6,
      keywords: ['新能源汽车', '电动车', '汽车市场', '销量'],
      readTime: 3,
    },
  ];

  const fetchArticles = async (pageNum: number = 1, reset: boolean = false) => {
    setLoading(true);
    setError(null);

    // 模拟网络延迟
    setTimeout(() => {
      let filteredArticles = mockArticles;

      // 应用搜索过滤
      if (searchTerm) {
        filteredArticles = filteredArticles.filter(article =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.summary?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // 应用来源过滤
      if (selectedSource !== 'all') {
        filteredArticles = filteredArticles.filter(article => article.source === selectedSource);
      }

      // 应用情感过滤
      if (selectedSentiment !== 'all') {
        if (selectedSentiment === 'positive') {
          filteredArticles = filteredArticles.filter(article => (article.sentiment || 0) > 0.3);
        } else if (selectedSentiment === 'negative') {
          filteredArticles = filteredArticles.filter(article => (article.sentiment || 0) < -0.3);
        } else {
          filteredArticles = filteredArticles.filter(article => {
            const sentiment = article.sentiment || 0;
            return sentiment >= -0.3 && sentiment <= 0.3;
          });
        }
      }

      // 分页
      const startIndex = (pageNum - 1) * 3;
      const endIndex = startIndex + 3;
      const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

      if (reset) {
        setArticles(paginatedArticles);
      } else {
        setArticles(prev => [...prev, ...paginatedArticles]);
      }

      setHasMore(endIndex < filteredArticles.length);
      setPage(pageNum);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchArticles(1, true);
  }, [searchTerm, selectedSource, selectedSentiment]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchArticles(page + 1, false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(1, true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="搜索新闻标题或内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
          </div>
        </form>

        <div className="flex gap-4 flex-wrap">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有来源</option>
            {sources.filter(s => s !== 'all').map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有情感</option>
            <option value="positive">积极</option>
            <option value="neutral">中性</option>
            <option value="negative">消极</option>
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && articles.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* 新闻列表 */}
      {articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && articles.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">暂无新闻</div>
          <div className="text-gray-400 mt-2">尝试调整筛选条件或稍后再试</div>
        </div>
      )}

      {/* 加载更多按钮 */}
      {articles.length > 0 && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

      {/* 没有更多内容提示 */}
      {articles.length > 0 && !hasMore && (
        <div className="text-center mt-8 text-gray-500">
          没有更多新闻了
        </div>
      )}
    </div>
  );
}