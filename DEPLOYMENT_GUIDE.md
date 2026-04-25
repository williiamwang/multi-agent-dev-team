# 多智能体开发团队工作流系统 - 部署指南

## 📋 系统要求

- **Node.js**: 18.0 或更高版本
- **MySQL/TiDB**: 5.7 或更高版本
- **Redis** (可选): 用于会话存储
- **Docker** (可选): 用于容器化部署

## 🚀 快速开始

### 1. 本地开发环境

```bash
# 克隆项目
git clone https://github.com/williiamwang/multi-agent-dev-team.git
cd multi-agent-dev-team

# 安装依赖
pnpm install

# 创建 .env 文件
cp .env.example .env

# 配置环境变量（见下文）
# 编辑 .env 文件

# 运行数据库迁移
pnpm db:push

# 启动开发服务器
pnpm dev
```

### 2. 环境变量配置

创建 `.env` 文件，包含以下配置：

```env
# 数据库
DATABASE_URL=mysql://user:password@localhost:3306/dev_team

# JWT 认证
JWT_SECRET=your-super-secret-key-change-in-production

# OpenAI LLM (选择一个)
OPENAI_API_KEY=sk-xxx...

# 或使用 Ollama 本地 LLM
OLLAMA_API_URL=http://localhost:11434

# 邮件通知 (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 文件存储
STORAGE_PROVIDER=local  # 或 minio
STORAGE_PATH=/data/uploads

# MinIO 配置 (如果使用 MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=dev-team

# 应用配置
APP_PORT=3000
APP_HOST=localhost
NODE_ENV=development
```

## 🐳 Docker 部署

### 使用 Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: dev_team
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://root:root@mysql:3306/dev_team
      JWT_SECRET: your-secret-key
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - mysql
    volumes:
      - ./data:/data

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  mysql_data:
  ollama_data:
  minio_data:
```

启动服务：

```bash
docker-compose up -d
```

## 📦 生产部署

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 创建 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'dev-team',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'mysql://user:pass@localhost:3306/dev_team',
      JWT_SECRET: 'your-secret-key'
    }
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 查看日志
pm2 logs dev-team

# 监控应用
pm2 monit
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name dev-team.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 支持
    location /socket.io {
        proxy_pass http://localhost:3000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

## 🔧 LLM 配置

### 使用 OpenAI

```env
OPENAI_API_KEY=sk-xxx...
```

### 使用本地 Ollama

1. 安装 Ollama: https://ollama.ai
2. 启动 Ollama 服务:
   ```bash
   ollama serve
   ```
3. 拉取模型:
   ```bash
   ollama pull mistral
   ollama pull neural-chat
   ```
4. 配置环境变量:
   ```env
   OLLAMA_API_URL=http://localhost:11434
   ```

## 💾 文件存储配置

### 本地存储

```env
STORAGE_PROVIDER=local
STORAGE_PATH=/data/uploads
```

### MinIO 存储

1. 启动 MinIO:
   ```bash
   docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
   ```

2. 配置环境变量:
   ```env
   STORAGE_PROVIDER=minio
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   ```

## 📧 邮件通知配置

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # 使用应用密码，不是账户密码
```

### 其他 SMTP 服务

根据您的邮件服务商配置相应的 SMTP 参数。

## 🔐 安全建议

1. **更改默认密钥**
   - 生成强随机的 JWT_SECRET
   - 更改 MinIO 的默认凭证

2. **使用 HTTPS**
   - 在生产环境使用 SSL/TLS 证书
   - 配置 Nginx 进行 HTTPS 转发

3. **数据库安全**
   - 使用强密码
   - 限制数据库访问 IP
   - 定期备份数据库

4. **API 密钥安全**
   - 不要在代码中硬编码 API 密钥
   - 使用环境变量管理敏感信息
   - 定期轮换 API 密钥

## 📊 监控和日志

### 应用日志

```bash
# 查看实时日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

### 数据库监控

```bash
# 连接到数据库
mysql -u root -p dev_team

# 查看表大小
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'dev_team'
ORDER BY size_mb DESC;
```

## 🆘 故障排查

### 数据库连接失败

```bash
# 检查数据库是否运行
mysql -u root -p -h localhost

# 检查连接字符串格式
# 应该是: mysql://user:password@host:port/database
```

### OpenAI API 错误

```bash
# 检查 API 密钥是否有效
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Ollama 连接失败

```bash
# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags

# 检查模型是否已拉取
ollama list
```

## 📈 性能优化

1. **数据库优化**
   - 为常用查询字段添加索引
   - 定期分析表统计信息

2. **缓存策略**
   - 使用 Redis 缓存会话
   - 缓存 AI 响应结果

3. **负载均衡**
   - 使用多个应用实例
   - 配置 Nginx 负载均衡

## 📚 更多资源

- [Node.js 文档](https://nodejs.org/docs/)
- [Express 文档](https://expressjs.com/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [OpenAI API 文档](https://platform.openai.com/docs/)
- [Ollama 文档](https://github.com/ollama/ollama)

## 🤝 支持

如有问题，请提交 Issue 或联系技术支持。
