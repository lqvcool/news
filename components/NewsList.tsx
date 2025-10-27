'use client';

import React, { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import { Article } from '@prisma/client';

interface NewsListProps {
  initialArticles?: Article[];
}

export default function NewsList({ initialArticles = [] }: NewsListProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');

  const sources = ['all', '微博热搜', '新浪新闻', '知乎热榜', '百度热榜', '今日头条', '腾讯新闻', '网易新闻', '凤凰新闻', 'Twitter', 'Reddit', 'Google News', 'BBC News', 'CNN News'];

  const fetchArticles = async (pageNum: number = 1, reset: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedSource !== 'all') params.append('source', selectedSource);
      if (selectedSentiment !== 'all') {
        if (selectedSentiment === 'positive') params.append('minSentiment', '0.3');
        else if (selectedSentiment === 'negative') params.append('maxSentiment', '-0.3');
        else params.append('minSentiment', '-0.3').append('maxSentiment', '0.3');
      }

      const response = await fetch(`/api/news/articles?${params}`);
      if (!response.ok) {
        throw new Error('获取新闻失败');
      }

      const data = await response.json();

      if (reset) {
        setArticles(data.articles);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取新闻失败');
    } finally {
      setLoading(false);
    }
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