'use client';

import React, { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token || token === 'undefined') {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
          return;
        }
        throw new Error('获取用户信息失败');
      }

      const data = await response.json();
      setUser(data.data?.user || data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
    } catch (err) {
      setError('登出失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">请先登录</h2>
          <a
            href="/auth/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            去登录
          </a>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                首页
              </a>
              <a href="/profile" className="text-blue-600 font-medium">
                个人中心
              </a>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                退出登录
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md">
          {/* 标签导航 */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                个人信息
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                通知设置
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                使用统计
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* 个人信息标签 */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">个人信息</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={user.name || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱地址
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                    <p className="text-sm text-gray-500 mt-1">邮箱地址无法修改</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      注册时间
                    </label>
                    <input
                      type="text"
                      value={user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '未知'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 通知设置标签 */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">通知设置</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-medium text-gray-900">邮件通知</h3>
                      <p className="text-sm text-gray-500">接收重要更新和新闻推荐的邮件通知</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-medium text-gray-900">每日摘要</h3>
                      <p className="text-sm text-gray-500">每天早上接收当日重要新闻摘要</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-medium text-gray-900">突发新闻提醒</h3>
                      <p className="text-sm text-gray-500">重要突发新闻的即时邮件提醒</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      保存设置
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 使用统计标签 */}
            {activeTab === 'stats' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">使用统计</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">账户信息</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">用户ID:</span>
                        <span className="text-blue-900 font-mono">{user.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">邮箱验证:</span>
                        <span className={user.emailVerified ? 'text-green-600' : 'text-orange-600'}>
                          {user.emailVerified ? '已验证' : '未验证'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">注册天数:</span>
                        <span className="text-blue-900">
                          {user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0} 天
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">新闻偏好</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">邮件通知:</span>
                        <span className="text-green-600">已开启</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">每日摘要:</span>
                        <span className="text-green-600">已订阅</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">突发提醒:</span>
                        <span className="text-gray-600">已关闭</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    更多详细的使用统计和数据分析功能正在开发中...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}