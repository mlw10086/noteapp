# 📝 Notes App - 现代化便签管理系统

一个功能丰富的现代化便签管理系统，支持实时协作、多用户管理、定时发布等高级功能。基于 Next.js 15 和 React 19 构建，提供优秀的用户体验和强大的功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## ✨ 主要功能

### 🔐 用户系统
- **用户注册/登录** - 基于 NextAuth.js 的安全认证
- **用户资料管理** - 头像上传、个人信息编辑
- **权限控制** - 多级权限管理系统

### 📋 便签管理
- **富文本编辑** - 支持 Markdown 语法的强大编辑器
- **便签分类** - 灵活的标签系统和颜色标记
- **定时发布** - 支持便签定时发布功能
- **批量操作** - 批量删除、编辑便签
- **搜索功能** - 全文搜索和标签筛选

### 🤝 实时协作
- **多人协作** - 基于 Socket.IO 的实时协作编辑
- **协作权限** - 邀请系统和权限管理
- **实时同步** - 光标位置、编辑状态实时同步
- **协作监控** - 管理员可监控协作会话

### 🎨 用户体验
- **响应式设计** - 完美适配桌面和移动设备
- **主题切换** - 支持深色/浅色主题
- **多语言支持** - 国际化 (i18n) 支持
- **无障碍访问** - 遵循 WCAG 标准

### 🛠 管理功能
- **管理员面板** - 完整的后台管理系统
- **用户管理** - 用户状态控制、权限分配
- **系统设置** - 全局配置和功能开关
- **协作控制** - 协作功能的全局管理

## 🚀 技术栈

### 前端技术
- **[Next.js 15.4.5](https://nextjs.org/)** - React 全栈框架
- **[React 19.1.0](https://react.dev/)** - 用户界面库
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - 实用优先的 CSS 框架
- **[Radix UI](https://www.radix-ui.com/)** - 无样式的 UI 组件库

### 后端技术
- **[Prisma](https://www.prisma.io/)** - 现代数据库 ORM
- **[PostgreSQL](https://www.postgresql.org/)** - 关系型数据库
- **[NextAuth.js](https://next-auth.js.org/)** - 认证解决方案
- **[Socket.IO](https://socket.io/)** - 实时通信库

### 开发工具
- **[ESLint](https://eslint.org/)** - 代码质量检查
- **[Prettier](https://prettier.io/)** - 代码格式化
- **[Husky](https://typicode.github.io/husky/)** - Git hooks 管理

## 📦 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- PostgreSQL 数据库
- npm/yarn/pnpm 包管理器

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd notes-app
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 3. 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置以下变量：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/notes_app"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# 其他配置
NODE_ENV="development"
```

### 4. 数据库设置

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# (可选) 填充示例数据
npx prisma db seed
```

### 5. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🗄️ 数据库配置

### PostgreSQL 设置

1. **安装 PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # macOS (使用 Homebrew)
   brew install postgresql

   # Windows
   # 下载并安装 PostgreSQL 官方安装包
   ```

2. **创建数据库**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE notes_app;
   CREATE USER notes_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE notes_app TO notes_user;
   \q
   ```

3. **配置连接字符串**
   ```env
   DATABASE_URL="postgresql://notes_user:your_password@localhost:5432/notes_app"
   ```

### 数据库迁移

```bash
# 创建新迁移
npx prisma migrate dev --name migration_name

# 重置数据库
npx prisma migrate reset

# 查看数据库状态
npx prisma migrate status
```
## 🚀 部署指南

本应用使用自定义服务器支持 Socket.IO 实时功能，以下是各平台的详细部署指南。

### 🌟 Railway 部署（推荐）

Railway 是部署此应用的最佳选择，完美支持自定义服务器和 WebSocket。

#### 1. 准备工作

确保你的项目已推送到 GitHub/GitLab。

#### 2. 部署步骤

1. **访问 [Railway](https://railway.app/) 并登录**

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 notes-app 仓库

3. **配置环境变量**
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   NEXTAUTH_URL=https://your-app-name.railway.app
   NEXTAUTH_SECRET=your-super-secret-key
   NODE_ENV=production
   PORT=3000
   ```

4. **配置构建命令**
   - Build Command: `npm run build`
   - Start Command: `npm start`

5. **数据库设置**
   - 在 Railway 中添加 PostgreSQL 服务
   - 复制数据库连接字符串到 `DATABASE_URL`

6. **部署完成**
   - Railway 会自动构建和部署
   - 获取分配的域名访问应用

#### Railway 配置文件 (railway.toml)

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

### 🎨 Render 部署

Render 提供免费层级，适合个人项目和小型应用。

#### 1. 部署步骤

1. **访问 [Render](https://render.com/) 并注册**

2. **创建 Web Service**
   - 连接 GitHub 仓库
   - 选择 notes-app 项目

3. **配置服务**
   ```
   Name: notes-app
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **环境变量配置**
   ```env
   DATABASE_URL=your_postgresql_url
   NEXTAUTH_URL=https://your-app-name.onrender.com
   NEXTAUTH_SECRET=your-secret-key
   NODE_ENV=production
   ```

5. **数据库设置**
   - 创建 PostgreSQL 数据库服务
   - 获取连接字符串

#### Render 配置文件 (render.yaml)

```yaml
services:
  - type: web
    name: notes-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: notes-db
          property: connectionString
      - key: NEXTAUTH_URL
        value: https://your-app-name.onrender.com
      - key: NEXTAUTH_SECRET
        generateValue: true

databases:
  - name: notes-db
    databaseName: notes_app
    user: notes_user
```

### 🔴 Heroku 部署

Heroku 是经典的部署平台，但需要付费计划。

#### 1. 安装 Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
# 下载并安装 Heroku CLI
```

#### 2. 部署步骤

```bash
# 登录 Heroku
heroku login

# 创建应用
heroku create your-app-name

# 添加 PostgreSQL 插件
heroku addons:create heroku-postgresql:mini

# 设置环境变量
heroku config:set NEXTAUTH_SECRET=your-secret-key
heroku config:set NODE_ENV=production
heroku config:set NEXTAUTH_URL=https://your-app-name.herokuapp.com

# 部署
git push heroku main

# 运行数据库迁移
heroku run npx prisma migrate deploy
```

#### Heroku 配置文件

**Procfile:**
```
web: npm start
```

**package.json 脚本更新:**
```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js",
    "heroku-postbuild": "npm run build"
  }
}
```
### 🖥️ VPS 部署（Ubuntu/CentOS）

VPS 部署提供最大的灵活性和控制权。

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib
```

#### 2. 数据库设置

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE notes_app;
CREATE USER notes_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE notes_app TO notes_user;
\q
```

#### 3. 应用部署

```bash
# 克隆项目
git clone <your-repo-url>
cd notes-app

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.production
# 编辑 .env.production 文件

# 构建应用
npm run build

# 运行数据库迁移
npx prisma migrate deploy

# 使用 PM2 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### PM2 配置文件 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'notes-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

#### 4. Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/notes-app
```

**Nginx 配置:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/notes-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL 证书 (Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### ⚡ Vercel 部署（需要特殊配置）

由于本应用使用自定义服务器和 Socket.IO，在 Vercel 上部署需要特殊处理。

#### 方案一：分离架构（推荐）

将前端和后端分离部署：

1. **前端部署到 Vercel**
   - 移除自定义服务器代码
   - 配置 API 路由指向后端服务器
   - 禁用 Socket.IO 相关功能或使用外部服务

2. **后端部署到其他平台**
   - 使用 Railway/Render 部署 Socket.IO 服务器
   - 配置 CORS 允许 Vercel 域名访问

#### 方案二：使用 Vercel Functions

```javascript
// api/socket.js
import { Server } from 'socket.io'

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {
      // Socket.IO 逻辑
    })
  }
  res.end()
}
```

**注意：** Vercel 的 Serverless Functions 有时间限制，不适合长连接。

### 🐳 Docker 部署

使用 Docker 容器化部署，适用于任何支持 Docker 的平台。

#### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://notes_user:password@db:5432/notes_app
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=notes_app
      - POSTGRES_USER=notes_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### 3. 部署命令

```bash
# 构建和启动
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 查看日志
docker-compose logs -f app
```
## 🔧 环境变量配置

创建 `.env.local` 文件并配置以下变量：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/notes_app"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-chars"

# 应用配置
NODE_ENV="development"
PORT=3000

# 可选：文件上传配置
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5242880" # 5MB

# 可选：邮件配置（用于通知）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# 可选：Redis 配置（用于会话存储）
REDIS_URL="redis://localhost:6379"
```

### 生产环境变量

```env
# 生产数据库
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# 生产域名
NEXTAUTH_URL="https://your-domain.com"

# 强密钥（生产环境必须）
NEXTAUTH_SECRET="your-production-secret-key-min-32-characters"

# 生产环境
NODE_ENV="production"
```

## 📋 生产环境检查清单

### 🔒 安全配置

- [ ] 设置强密码的 `NEXTAUTH_SECRET`
- [ ] 配置 HTTPS（SSL 证书）
- [ ] 启用数据库 SSL 连接
- [ ] 配置 CORS 策略
- [ ] 设置安全头部（CSP、HSTS 等）
- [ ] 定期更新依赖包

### 🚀 性能优化

- [ ] 启用数据库连接池
- [ ] 配置 CDN（静态资源）
- [ ] 启用 Gzip 压缩
- [ ] 配置缓存策略
- [ ] 监控应用性能
- [ ] 设置日志记录

### 🔄 备份和监控

- [ ] 配置数据库自动备份
- [ ] 设置应用监控（Uptime）
- [ ] 配置错误日志收集
- [ ] 设置性能监控
- [ ] 准备灾难恢复计划

## 🛠️ 开发工具

### 数据库管理

```bash
# 查看数据库状态
npx prisma studio

# 重置数据库
npx prisma migrate reset

# 生成新迁移
npx prisma migrate dev --name your_migration_name

# 部署迁移到生产环境
npx prisma migrate deploy
```

### 代码质量

```bash
# 运行 ESLint
npm run lint

# 修复 ESLint 错误
npm run lint:fix

# 运行类型检查
npx tsc --noEmit

# 格式化代码
npx prettier --write .
```

### 测试

```bash
# 运行单元测试
npm run test

# 运行端到端测试
npm run test:e2e

# 生成测试覆盖率报告
npm run test:coverage
```

## 🐛 故障排除

### 常见问题

#### 1. 数据库连接失败

**错误信息：** `Error: P1001: Can't reach database server`

**解决方案：**
```bash
# 检查数据库是否运行
sudo systemctl status postgresql

# 检查连接字符串格式
DATABASE_URL="postgresql://user:password@host:port/database"

# 测试连接
npx prisma db pull
```

#### 2. Socket.IO 连接问题

**错误信息：** `WebSocket connection failed`

**解决方案：**
```javascript
// 检查服务器配置
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL,
    methods: ["GET", "POST"]
  }
})
```

#### 3. NextAuth 会话问题

**错误信息：** `[next-auth][error][JWT_SESSION_ERROR]`

**解决方案：**
```bash
# 确保 NEXTAUTH_SECRET 已设置
echo $NEXTAUTH_SECRET

# 清除浏览器 cookies
# 重新生成 secret
openssl rand -base64 32
```

#### 4. 构建失败

**错误信息：** `Module not found` 或 `Type errors`

**解决方案：**
```bash
# 清除缓存
rm -rf .next node_modules
npm install

# 重新生成 Prisma 客户端
npx prisma generate

# 检查 TypeScript 错误
npx tsc --noEmit
```

#### 5. 部署后 404 错误

**可能原因：**
- 静态文件路径错误
- 服务器路由配置问题
- 环境变量未正确设置

**解决方案：**
```bash
# 检查构建输出
npm run build

# 验证环境变量
printenv | grep NEXTAUTH

# 检查服务器日志
pm2 logs notes-app
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 开发规范

- 遵循现有的代码风格
- 添加适当的测试
- 更新相关文档
- 确保所有测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Prisma](https://www.prisma.io/) - 现代数据库工具
- [Socket.IO](https://socket.io/) - 实时通信库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - UI 组件库

## 📞 支持

如果你遇到任何问题或有疑问，请：

1. 查看 [故障排除](#-故障排除) 部分
2. 搜索现有的 [Issues](https://github.com/your-username/notes-app/issues)
3. 创建新的 Issue 描述你的问题
4. 加入我们的社区讨论

## 🔄 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- 🔐 用户认证系统
- 📝 便签 CRUD 功能
- 🤝 实时协作功能
- 🎨 主题切换支持
- 🌍 多语言支持

---

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

**🚀 Happy Coding!**

#### 2. 部署步骤

1. **访问 [Railway](https://railway.app/) 并登录**

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 notes-app 仓库

3. **配置环境变量**
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   NEXTAUTH_URL=https://your-app-name.railway.app
   NEXTAUTH_SECRET=your-super-secret-key
   NODE_ENV=production
   PORT=3000
   ```

4. **配置构建命令**
   - Build Command: `npm run build`
   - Start Command: `npm start`

5. **数据库设置**
   - 在 Railway 中添加 PostgreSQL 服务
   - 复制数据库连接字符串到 `DATABASE_URL`

6. **部署完成**
   - Railway 会自动构建和部署
   - 获取分配的域名访问应用

#### Railway 配置文件 (railway.toml)

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

### 🎨 Render 部署

Render 提供免费层级，适合个人项目和小型应用。

#### 1. 部署步骤

1. **访问 [Render](https://render.com/) 并注册**

2. **创建 Web Service**
   - 连接 GitHub 仓库
   - 选择 notes-app 项目

3. **配置服务**
   ```
   Name: notes-app
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **环境变量配置**
   ```env
   DATABASE_URL=your_postgresql_url
   NEXTAUTH_URL=https://your-app-name.onrender.com
   NEXTAUTH_SECRET=your-secret-key
   NODE_ENV=production
   ```

5. **数据库设置**
   - 创建 PostgreSQL 数据库服务
   - 获取连接字符串

#### Render 配置文件 (render.yaml)

```yaml
services:
  - type: web
    name: notes-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: notes-db
          property: connectionString
      - key: NEXTAUTH_URL
        value: https://your-app-name.onrender.com
      - key: NEXTAUTH_SECRET
        generateValue: true

databases:
  - name: notes-db
    databaseName: notes_app
    user: notes_user
```

### 🔴 Heroku 部署

Heroku 是经典的部署平台，但需要付费计划。

#### 1. 安装 Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
# 下载并安装 Heroku CLI
```

#### 2. 部署步骤

```bash
# 登录 Heroku
heroku login

# 创建应用
heroku create your-app-name

# 添加 PostgreSQL 插件
heroku addons:create heroku-postgresql:mini

# 设置环境变量
heroku config:set NEXTAUTH_SECRET=your-secret-key
heroku config:set NODE_ENV=production
heroku config:set NEXTAUTH_URL=https://your-app-name.herokuapp.com

# 部署
git push heroku main

# 运行数据库迁移
heroku run npx prisma migrate deploy
```

#### Heroku 配置文件

**Procfile:**
```
web: npm start
```

**package.json 脚本更新:**
```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js",
    "heroku-postbuild": "npm run build"
  }
}
```

### 🖥️ VPS 部署（Ubuntu/CentOS）

VPS 部署提供最大的灵活性和控制权。

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib
```

#### 2. 数据库设置

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE notes_app;
CREATE USER notes_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE notes_app TO notes_user;
\q
```

#### 3. 应用部署

```bash
# 克隆项目
git clone <your-repo-url>
cd notes-app

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.production
# 编辑 .env.production 文件

# 构建应用
npm run build

# 运行数据库迁移
npx prisma migrate deploy

# 使用 PM2 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### PM2 配置文件 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'notes-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

#### 4. Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/notes-app
```

**Nginx 配置:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/notes-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL 证书 (Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```
