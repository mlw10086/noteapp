# 🚀 部署快速指南

## 最推荐的部署方案

### 1. Railway 部署（推荐）⭐

**为什么选择 Railway？**
- 原生支持 WebSocket 和自定义服务器
- 简单的配置和部署流程
- 自动 HTTPS 和域名分配
- 优秀的开发者体验

**快速部署步骤：**
```bash
# 1. 推送代码到 GitHub
git push origin master

# 2. 访问 railway.app 并连接 GitHub 仓库
# 3. 添加 PostgreSQL 服务
# 4. 设置环境变量：
#    DATABASE_URL=<railway-postgres-url>
#    NEXTAUTH_URL=https://your-app.railway.app
#    NEXTAUTH_SECRET=<32-char-secret>
#    NODE_ENV=production

# 5. 部署完成！
```

### 2. Render 部署（免费选择）

**适合场景：** 个人项目、原型开发

**快速部署：**
```bash
# 1. 在 render.com 创建 Web Service
# 2. 连接 GitHub 仓库
# 3. 配置：
#    Build Command: npm install && npm run build
#    Start Command: npm start
# 4. 添加 PostgreSQL 数据库
# 5. 设置环境变量并部署
```

### 3. VPS 部署（完全控制）

**一键部署脚本：**
```bash
#!/bin/bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib

# 安装 PM2
sudo npm install -g pm2

# 克隆并部署
git clone <your-repo-url>
cd notes-app
npm install
npm run build
pm2 start ecosystem.config.js
```

## 环境变量快速配置

```env
# 必需变量
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-32-char-secret"
NODE_ENV="production"

# 生成密钥
openssl rand -base64 32
```

## 常见问题快速解决

### Socket.IO 连接失败
```javascript
// 检查 CORS 配置
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL,
    methods: ["GET", "POST"]
  }
})
```

### 数据库连接失败
```bash
# 测试连接
npx prisma db pull

# 重新生成客户端
npx prisma generate
```

### 构建失败
```bash
# 清除缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

## 部署后检查清单

- [ ] 应用可以正常访问
- [ ] 用户注册/登录功能正常
- [ ] 便签 CRUD 操作正常
- [ ] Socket.IO 实时功能正常
- [ ] 数据库连接稳定
- [ ] HTTPS 证书有效
- [ ] 环境变量配置正确

## 监控和维护

```bash
# PM2 监控
pm2 monit

# 查看日志
pm2 logs notes-app

# 重启应用
pm2 restart notes-app

# 数据库备份
pg_dump notes_app > backup.sql
```

---
**💡 提示：** 首次部署建议使用 Railway，配置最简单且功能完整！
