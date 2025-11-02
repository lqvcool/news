import { NewsDigest } from './gemini'

export interface EmailTemplate {
  subject: string
  htmlContent: string
  textContent: string
}

export function generateNewsDigestEmail(userName: string, digest: NewsDigest): EmailTemplate {
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const subject = `${currentDate} - NewsHub 新闻摘要`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 650px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header .date {
      margin-top: 8px;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 30px;
    }
    .summary-section {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #667eea;
    }
    .summary-section h2 {
      margin: 0 0 12px 0;
      color: #475569;
      font-size: 18px;
    }
    .category-section {
      margin-bottom: 30px;
    }
    .category-title {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      color: #334155;
      font-size: 20px;
      font-weight: 600;
    }
    .category-badge {
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin-left: 10px;
    }
    .highlight-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      transition: all 0.2s;
    }
    .highlight-item:hover {
      border-color: #667eea;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .highlight-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .highlight-summary {
      color: #64748b;
      font-size: 14px;
    }
    .trending-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .trending-section h3 {
      margin: 0 0 15px 0;
      color: #92400e;
      font-size: 18px;
    }
    .trending-topics {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .topic-tag {
      background: white;
      color: #92400e;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      border: 1px solid #f59e0b;
    }
    .sentiment-section {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
    }
    .sentiment-bar {
      display: flex;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin: 15px 0;
    }
    .sentiment-positive {
      background: #10b981;
      flex: ${digest.sentiment.positive};
    }
    .sentiment-negative {
      background: #ef4444;
      flex: ${digest.sentiment.negative};
    }
    .sentiment-neutral {
      background: #6b7280;
      flex: ${digest.sentiment.neutral};
    }
    .footer {
      background: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    .stat-item {
      text-align: center;
    }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📰 NewsHub 新闻摘要</h1>
      <div class="date">${currentDate}</div>
    </div>

    <div class="content">
      <div class="summary-section">
        <h2>📋 今日概览</h2>
        <p>${digest.summary}</p>

        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${digest.categories.reduce((sum, cat) => sum + cat.articles, 0)}</div>
            <div class="stat-label">新闻总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${digest.categories.length}</div>
            <div class="stat-label">分类数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${digest.trendingTopics.length}</div>
            <div class="stat-label">热点话题</div>
          </div>
        </div>
      </div>

      ${digest.categories.length > 0 ? `
        <div class="category-section">
          <div class="category-title">
            📂 分类新闻
          </div>
          ${digest.categories.map(category => `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #475569; margin-bottom: 12px; display: flex; align-items: center;">
                ${category.name}
                <span class="category-badge">${category.articles} 条</span>
              </h3>
              ${category.highlights.map(highlight => `
                <div class="highlight-item">
                  <div class="highlight-title">📌 ${highlight}</div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${digest.trendingTopics.length > 0 ? `
        <div class="trending-section">
          <h3>🔥 热点话题</h3>
          <div class="trending-topics">
            ${digest.trendingTopics.map(topic => `
              <span class="topic-tag">#${topic}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="sentiment-section">
        <h3>😊 情感分析</h3>
        <div class="sentiment-bar">
          <div class="sentiment-positive" style="flex: ${digest.sentiment.positive};"></div>
          <div class="sentiment-neutral" style="flex: ${digest.sentiment.neutral};"></div>
          <div class="sentiment-negative" style="flex: ${digest.sentiment.negative};"></div>
        </div>
        <div style="display: flex; justify-content: space-around; font-size: 12px;">
          <span>积极 ${digest.sentiment.positive}%</span>
          <span>中性 ${digest.sentiment.neutral}%</span>
          <span>消极 ${digest.sentiment.negative}%</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>👋 您好，${userName}！</p>
      <p>这是您个性化的新闻摘要，希望对您有帮助。</p>
      <p style="margin-top: 15px;">
        <a href="#" style="color: #667eea;">修改订阅设置</a> |
        <a href="#" style="color: #667eea;">取消订阅</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px;">
        © 2024 NewsHub. All rights reserved.<br>
        如您不想收到此类邮件，请点击取消订阅。
      </p>
    </div>
  </div>
</body>
</html>
  `

  const textContent = `
NewsHub 新闻摘要 - ${currentDate}

你好 ${userName}！

${digest.summary}

今日统计：
- 新闻总数：${digest.categories.reduce((sum, cat) => sum + cat.articles, 0)} 条
- 分类数量：${digest.categories.length} 个
- 热点话题：${digest.trendingTopics.length} 个

分类新闻：
${digest.categories.map(category => `
${category.name} (${category.articles} 条)
${category.highlights.map(highlight => `• ${highlight}`).join('\n')}
`).join('\n')}

热点话题：
${digest.trendingTopics.map(topic => `#${topic}`).join(', ')}

情感分析：
- 积极：${digest.sentiment.positive}%
- 中性：${digest.sentiment.neutral}%
- 消极：${digest.sentiment.negative}%

---
感谢您使用 NewsHub！
如需修改订阅设置或取消订阅，请访问我们的网站。
© 2024 NewsHub. All rights reserved.
  `

  return {
    subject,
    htmlContent,
    textContent
  }
}

export function generateWelcomeEmail(userName: string, email: string): EmailTemplate {
  const subject = '欢迎加入 NewsHub！'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
      border-radius: 12px 12px 0 0;
    }
    .content {
      background: white;
      padding: 40px;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    .feature {
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      text-align: center;
    }
    .feature-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 欢迎加入 NewsHub！</h1>
    <p>您的智能新闻助手已准备就绪</p>
  </div>

  <div class="content">
    <p>你好 ${userName}，</p>
    <p>感谢您注册 NewsHub！我们很高兴您选择我们作为您的新闻获取平台。</p>

    <div class="feature-grid">
      <div class="feature">
        <div class="feature-icon">📰</div>
        <h3>多源新闻</h3>
        <p>整合国内外主流新闻媒体</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🤖</div>
        <h3>AI 处理</h3>
        <p>智能摘要和个性化推荐</p>
      </div>
      <div class="feature">
        <div class="feature-icon">📧</div>
        <h3>邮件推送</h3>
        <p>定时发送精选新闻摘要</p>
      </div>
      <div class="feature">
        <div class="feature-icon">⚙️</div>
        <h3>个性化设置</h3>
        <p>自定义您的新闻偏好</p>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}" class="cta-button">
        开始使用 NewsHub
      </a>
    </div>

    <p>接下来，您可以：</p>
    <ul>
      <li>设置您的新闻偏好</li>
      <li>选择要订阅的新闻源</li>
      <li>配置邮件推送时间</li>
      <li>查看个性化推荐</li>
    </ul>
  </div>
</body>
</html>
  `

  const textContent = `
欢迎加入 NewsHub！

你好 ${userName}，

感谢您注册 NewsHub！我们很高兴您选择我们作为您的新闻获取平台。

NewsHub 的主要功能：
• 多源新闻 - 整合国内外主流新闻媒体
• AI 处理 - 智能摘要和个性化推荐
• 邮件推送 - 定时发送精选新闻摘要
• 个性化设置 - 自定义您的新闻偏好

访问我们的网站开始使用：${process.env.NEXTAUTH_URL}

接下来，您可以：
- 设置您的新闻偏好
- 选择要订阅的新闻源
- 配置邮件推送时间
- 查看个性化推荐

如有任何问题，请随时联系我们。

祝好！
NewsHub 团队
  `

  return {
    subject,
    htmlContent,
    textContent
  }
}