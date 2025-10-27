import React from 'react';
import { Article } from '@prisma/client';

interface NewsCardProps {
  article: Article;
}

export default function NewsCard({ article }: NewsCardProps) {
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