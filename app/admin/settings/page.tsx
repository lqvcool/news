'use client';

import React, { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('apis');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // API配置状态
  const [apiKeys, setApiKeys] = useState({
    resendApiKey: '',
    geminiApiKey: '',
    fromEmail: 'noreply@yourdomain.com',
    jwtSecret: '',
    jwtRefreshSecret: ''
  });

  // 系统状态
  const [systemStatus, setSystemStatus] = useState({
    newsCollection: 'idle',
    emailService: 'unknown',
    aiProcessing: 'unknown'
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined') {
        setLoading(false);
        return;
      }

      // 检查用户是否为管理员（这里简化处理，实际项目中应该有角色管理）
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        await fetchCurrentSettings();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.apiKeys) {
          setApiKeys(data.apiKeys);
        }
        if (data.systemStatus) {
          setSystemStatus(data.systemStatus);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleApiKeyChange = (key: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveApiKeys = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateApiKeys',
          apiKeys
        }),
      });

      if (response.ok) {
        setSuccessMessage('API密钥更新成功！');
        // 更新环境变量
        await fetchSystemStatus();
      } else {
        throw new Error('更新失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkSystemStatus'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.systemStatus);
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  };

  const testEmailService = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: apiKeys.fromEmail,
          message: '这是一封测试邮件，用于验证邮件服务配置是否正确。'
        }),
      });

      if (response.ok) {
        setSuccessMessage('测试邮件发送成功！');
      } else {
        throw new Error('邮件发送失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败');
    } finally {
      setSaving(false);
    }
  };

  const testGeminiAPI = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/test-gemini', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: '请简单介绍一下人工智能的发展历程。'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Gemini API测试成功！响应: ' + data.response?.substring(0, 100) + '...');
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'API测试失败';

        // 如果有建议，添加到错误信息中
        if (errorData.suggestions && errorData.suggestions.length > 0) {
          errorMessage += '\n\n建议解决方案：\n' + errorData.suggestions.map((s: string) => '• ' + s).join('\n');
        }

        // 如果有技术细节，也显示
        if (errorData.technicalDetails) {
          errorMessage += '\n\n技术细节：' + errorData.technicalDetails;
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败');
    } finally {
      setSaving(false);
    }
  };

  const triggerNewsCollection = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/trigger-collection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccessMessage('新闻收集任务已启动！');
        setSystemStatus(prev => ({
          ...prev,
          newsCollection: 'running'
        }));
        // 轮询状态
        setTimeout(() => fetchSystemStatus(), 5000);
      } else {
        throw new Error('启动失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold mb-2">访问被拒绝</h2>
          <p className="text-sm">您没有权限访问管理员设置页面。</p>
          <a href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 block">
            返回首页
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
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚙️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">管理员设置</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                首页
              </a>
              <a href="/profile" className="text-gray-700 hover:text-blue-600 font-medium">
                个人中心
              </a>
              <a href="/admin/settings" className="text-red-600 font-medium">
                管理员设置
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-green-600 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="whitespace-pre-wrap">
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          {/* 标签导航 */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('apis')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'apis'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                API配置
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'system'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                系统状态
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                操作日志
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* API配置标签 */}
            {activeTab === 'apis' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">API密钥配置</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">邮件服务配置 (Resend)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resend API Key
                        </label>
                        <input
                          type="password"
                          value={apiKeys.resendApiKey}
                          onChange={(e) => handleApiKeyChange('resendApiKey', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="输入您的Resend API密钥"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          从 <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">Resend控制台</a> 获取
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          发件邮箱地址
                        </label>
                        <input
                          type="email"
                          value={apiKeys.fromEmail}
                          onChange={(e) => handleApiKeyChange('fromEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="noreply@yourdomain.com"
                        />
                      </div>
                      <div className="pt-4">
                        <button
                          onClick={testEmailService}
                          disabled={saving || !apiKeys.resendApiKey}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mr-4"
                        >
                          {saving ? '测试中...' : '测试邮件服务'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">AI服务配置 (Google Gemini)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gemini API Key
                        </label>
                        <input
                          type="password"
                          value={apiKeys.geminiApiKey}
                          onChange={(e) => handleApiKeyChange('geminiApiKey', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="输入您的Gemini API密钥"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          从 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">Google AI Studio</a> 获取
                        </p>
                      </div>
                      <div className="pt-4">
                        <button
                          onClick={testGeminiAPI}
                          disabled={saving || !apiKeys.geminiApiKey}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mr-4"
                        >
                          {saving ? '测试中...' : '测试AI服务'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <button
                      onClick={saveApiKeys}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '保存中...' : '保存配置'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 系统状态标签 */}
            {activeTab === 'system' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">系统状态</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-4">新闻收集</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">状态:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          systemStatus.newsCollection === 'running' ? 'bg-green-100 text-green-800' :
                          systemStatus.newsCollection === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {systemStatus.newsCollection === 'running' ? '运行中' :
                           systemStatus.newsCollection === 'error' ? '错误' : '空闲'}
                        </span>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={triggerNewsCollection}
                          disabled={saving || systemStatus.newsCollection === 'running'}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {systemStatus.newsCollection === 'running' ? '正在收集...' : '开始收集'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-4">邮件服务</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">状态:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          systemStatus.emailService === 'configured' ? 'bg-green-100 text-green-800' :
                          systemStatus.emailService === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {systemStatus.emailService === 'configured' ? '已配置' :
                           systemStatus.emailService === 'error' ? '配置错误' : '未配置'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-900 mb-4">AI处理服务</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-700">状态:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          systemStatus.aiProcessing === 'available' ? 'bg-green-100 text-green-800' :
                          systemStatus.aiProcessing === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {systemStatus.aiProcessing === 'available' ? '可用' :
                           systemStatus.aiProcessing === 'error' ? '配置错误' : '未配置'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 操作日志标签 */}
            {activeTab === 'logs' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">系统日志</h2>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <div className="space-y-1">
                    <div className="text-green-400">
                      [{new Date().toLocaleString()}] 系统启动成功
                    </div>
                    <div className="text-blue-400">
                      [{new Date().toLocaleString()}] 管理员设置页面加载
                    </div>
                    <div className="text-yellow-400">
                      [{new Date().toLocaleString()}] 正在检查系统状态...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}