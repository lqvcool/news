# 智能新闻平台

一个基于 Next.js 15 和 React 19 的现代化智能新闻聚合与分析平台。

## 功能特性

### 🏠 用户功能
- **用户认证**：完整的登录/注册系统，JWT令牌认证
- **新闻浏览**：响应式新闻卡片展示，支持多源新闻聚合
- **个人中心**：用户资料管理、通知设置、使用统计

### 🛠️ 管理员功能
- **API配置管理**：可视化配置邮件服务、AI服务等API密钥
- **系统状态监控**：实时监控新闻收集、邮件服务、AI处理状态
- **新闻收集管理**：手动触发新闻收集任务
- **服务测试**：一键测试邮件服务和AI服务连接

### 🔧 技术特性
- **现代技术栈**：Next.js 15.5.6、React 19.1.0、TypeScript
- **数据库管理**：Prisma ORM + SQLite
- **样式系统**：Tailwind CSS v4
- **API集成**：支持 Google Gemini AI、Resend 邮件服务
- **响应式设计**：完全适配桌面和移动设备
- **错误处理**：完善的错误提示和解决方案建议

## 项目结构

```
news/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理员页面
│   │   └── settings/      # 管理员设置页面
│   ├── api/               # API路由
│   │   ├── admin/         # 管理员API
│   │   ├── auth/          # 认证API
│   │   └── user/          # 用户API
│   ├── auth/              # 认证页面
│   │   ├── login/         # 登录页面
│   │   └── register/      # 注册页面
│   ├── profile/           # 用户个人中心
│   └── globals.css        # 全局样式
├── components/            # React组件
│   ├── NewsCard.tsx       # 新闻卡片组件
│   └── NewsList.tsx       # 新闻列表组件
├── lib/                   # 工具库
│   ├── auth.ts            # 认证相关
│   └── api-middleware.ts  # API中间件
├── prisma/                # 数据库配置
│   ├── schema.prisma      # 数据库模型
│   └── seed.ts            # 种子数据
├── scripts/               # 脚本文件
│   ├── test-gemini.js     # Gemini API测试脚本
│   └── test-news-collector.ts # 新闻收集测试
└── public/                # 静态资源
```

## 技术栈

- **前端框架**：Next.js 15.5.6 (App Router)
- **UI库**：React 19.1.0
- **语言**：TypeScript
- **样式**：Tailwind CSS v4
- **数据库**：Prisma + SQLite
- **认证**：JWT (Access + Refresh tokens)
- **AI服务**：Google Gemini API
- **邮件服务**：Resend
- **HTTP客户端**：Axios
- **表单处理**：React Hook Form + Zod

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 环境配置
复制 `.env.example` 到 `.env` 并配置以下变量：

```env
# 数据库配置
DATABASE_URL="file:./dev.db"

# JWT密钥
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# 邮件服务配置
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="onboarding@resend.dev"

# Gemini AI配置
GEMINI_API_KEY="your-gemini-api-key"

# 应用配置
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. 数据库初始化
```bash
npx prisma migrate dev
npm run db:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 默认管理员账户

- **邮箱**：lqvcool@163.com
- **密码**：lq898101

## API配置说明

### 邮件服务 (Resend)
1. 访问 [Resend控制台](https://resend.com)
2. 注册账户并获取API密钥
3. 在管理员设置页面配置Resend API Key

### AI服务 (Google Gemini)
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建API密钥
3. 在管理员设置页面配置Gemini API Key

**注意**：Gemini API在某些地区可能受限制，如遇到地区限制问题，请参考错误提示中的解决方案。

## 开发命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 数据库相关
npm run db:seed       # 生成种子数据
npm run db:reset      # 重置数据库

# 测试脚本
npm run test-collector    # 测试新闻收集
node scripts/test-gemini.js # 测试Gemini API

# 启动调度器
npm run scheduler     # 启动新闻收集调度器
```

## 项目特色

1. **完整的用户系统**：注册、登录、个人中心
2. **智能新闻聚合**：支持RSS、API、网页抓取等多种新闻源
3. **AI集成**：集成Google Gemini进行内容分析和处理
4. **管理员后台**：完整的管理员设置和系统监控功能
5. **现代化UI**：基于Tailwind CSS的响应式设计
6. **错误处理**：详细的错误提示和解决方案建议
7. **安全性**：JWT认证、API权限控制

## 部署说明

1. 设置生产环境变量
2. 构建项目：`npm run build`
3. 启动生产服务器：`npm run start`

## 许可证

MIT License

## 贡献

欢迎提交 Pull Request 和 Issue！

---

⚡ **注意**：本项目为学习和演示用途，生产环境使用请确保安全性配置。
