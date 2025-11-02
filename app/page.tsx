'use client';

import React, { useState, useEffect } from 'react';
import NewsList from '@/components/NewsList';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && token !== 'undefined') {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data?.user || data.user);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">智能新闻聚合平台</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                首页
              </a>
              <a href="/profile" className="text-gray-700 hover:text-blue-600 font-medium">
                个人中心
              </a>
              {user && (user.email === 'lqvcool@163.com' || user.id === 1) && (
                <a href="/admin/settings" className="text-red-600 hover:text-red-700 font-medium">
                  管理员设置
                </a>
              )}
              {user ? (
                <span className="text-gray-600 font-medium">
                  欢迎, {user.name || user.email}
                </span>
              ) : (
                <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  登录
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main>
        <NewsList />
      </main>

      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">关于我们</h3>
              <p className="text-gray-300 text-sm">
                智能新闻聚合平台，为您提供最新、最全面的新闻资讯，结合AI技术为您提供个性化的新闻阅读体验。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">功能特点</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• 多源新闻聚合</li>
                <li>• AI智能摘要</li>
                <li>• 情感分析</li>
                <li>• 个性化推荐</li>
                <li>• 邮件推送</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">联系我们</h3>
              <p className="text-gray-300 text-sm">
                如有任何问题或建议，欢迎通过以下方式联系我们：
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-300">
                <p>邮箱：contact@news-platform.com</p>
                <p>电话：400-123-4567</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
            <p>&copy; 2024 智能新闻聚合平台. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}