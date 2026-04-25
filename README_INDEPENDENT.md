# 多智能体开发团队工作流系统 - 完全独立版本

## 🎯 项目简介

这是一个**完全独立于任何平台**的多智能体开发团队工作流系统。系统通过 AI Agent 自动化完整的研发流水线，从需求到发布的全过程。

### ✨ 核心特性

- **完全独立** - 不依赖 Manus 或任何其他平台
- **开源技术栈** - 使用广泛支持的开源技术
- **多 LLM 支持** - 支持 OpenAI、Ollama、本地模型
- **灵活存储** - 支持本地、MinIO、S3 存储
- **标准认证** - JWT + Passport 认证系统
- **生产就绪** - 包含完整的部署和监控方案

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (React 19)                       │
├─────────────────────────────────────────────────────────┤
│                  tRPC API 层                             │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  工作流引擎  │  │  AI Agent    │  │  任务管理    │   │
│  │  (Workflow)  │  │  (Executor)  │  │  (Tasks)     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  LLM 层      │  │  存储层      │  │  通知层      │   │
│  │  (OpenAI/    │  │  (Local/     │  │  (Email/     │   │
│  │   Ollama)    │  │   MinIO/S3)  │  │   WebSocket) │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────┤
│                  MySQL 数据库                            │
└─────────────────────────────────────────────────────────┘
```

## 📊 工作流流程

```
CPO 需求分析
    ↓
Architect 架构设计
    ↓
PM 任务分解
    ↓
Dev 开发实现
    ↓
QA 测试验证
    ↓
OSS Scout 技术调研 (并行)
    ↓
完成交付
```

**关键节点**：每个阶段都有老板确认门控

## 🚀 快速开始

### 最小化部署（5 分钟）

```bash
# 1. 克隆项目
git clone https://github.com/williiamwang/multi-agent-dev-team.git
cd multi-agent-dev-team

# 2. 使用 Docker Compose 启动所有服务
docker-compose up -d

# 3. 运行数据库迁移
docker-compose exec app pnpm db:push

# 4. 访问应用
# 前端: http://localhost:3000
# MinIO: http://localhost:9001 (minioadmin/minioadmin)
# MailHog: http://localhost:8025
```

### 本地开发环境

```bash
# 1. 安装依赖
pnpm install

# 2. 启动 MySQL
docker run -d -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=dev_team \
  mysql:8.0

# 3. 启动 Ollama (可选)
docker run -d -p 11434:11434 ollama/ollama
ollama pull mistral

# 4. 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL=mysql://root:root@localhost:3306/dev_team
JWT_SECRET=dev-secret-key
OLLAMA_API_URL=http://localhost:11434
STORAGE_PROVIDER=local
STORAGE_PATH=./data/uploads
EOF

# 5. 运行迁移
pnpm db:push

# 6. 启动开发服务器
pnpm dev
```

## 🔑 环境配置

### 必需配置

```env
# 数据库
DATABASE_URL=mysql://user:password@host:port/database

# JWT 密钥
JWT_SECRET=your-super-secret-key
```

### LLM 配置（选一个）

**选项 A: OpenAI (推荐生产环境)**
```env
OPENAI_API_KEY=sk-xxx...
```

**选项 B: 本地 Ollama (推荐开发环境)**
```env
OLLAMA_API_URL=http://localhost:11434
```

### 存储配置（选一个）

**选项 A: 本地存储 (推荐开发)**
```env
STORAGE_PROVIDER=local
STORAGE_PATH=/data/uploads
```

**选项 B: MinIO (推荐生产)**
```env
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

**选项 C: AWS S3**
```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=dev-team
```

### 邮件配置

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📚 主要功能

### 1. 工作流仪表盘
- 可视化的 CPO → Architect → PM → Dev → QA 流水线
- 实时阶段状态展示
- 老板确认节点管理

### 2. AI Agent 执行
- 6 个专业角色自动化执行
- 多轮对话和上下文管理
- 结果自动保存和归档

### 3. 文档管理
- PRD、架构、接口、测试报告统一管理
- 文档版本控制
- 一键下载

### 4. 任务看板
- 原子化任务卡片
- 前端/后端/基础设施分类
- 任务依赖关系管理

### 5. Bug 追踪
- Traceback 格式提交
- 严重程度分级（HIGH/MEDIUM/LOW）
- Dev 的 Hotfix 方案回复

### 6. 争议仲裁
- 3 轮讨论 → Architect 仲裁 → 老板决策
- 完整的仲裁记录

## 🔧 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React 19 | 现代 UI 框架 |
| | Vite | 快速构建工具 |
| | Tailwind CSS 4 | 样式框架 |
| | shadcn/ui | UI 组件库 |
| **后端** | Express.js | Web 框架 |
| | tRPC | 类型安全 RPC |
| | Drizzle ORM | 数据库 ORM |
| **数据库** | MySQL 8.0 | 关系数据库 |
| | Drizzle Kit | 迁移工具 |
| **LLM** | OpenAI API | 云端 LLM |
| | Ollama | 本地 LLM |
| **存储** | 本地文件系统 | 开发环境 |
| | MinIO | 生产环境 |
| | AWS S3 | 云端存储 |
| **认证** | JWT | 令牌认证 |
| | Passport.js | 认证框架 |
| **通知** | SMTP | 邮件通知 |
| | WebSocket | 实时通知 |
| **部署** | Docker | 容器化 |
| | Docker Compose | 本地编排 |
| | PM2 | 进程管理 |

## 📖 API 文档

### 认证 API

```typescript
// 登录
POST /api/trpc/auth.loginLocal
{
  email: "user@example.com",
  password: "password123"
}

// 刷新令牌
POST /api/trpc/auth.refreshToken
{
  refreshToken: "refresh_token_here"
}

// 获取当前用户
GET /api/trpc/auth.me
```

### 工作流 API

```typescript
// 创建工作流
POST /api/trpc/workflows.create
{
  name: "Feature X",
  description: "Implement feature X"
}

// 获取工作流
GET /api/trpc/workflows.get?id=1

// 执行阶段
POST /api/trpc/workflows.executeStage
{
  workflowId: 1,
  stageId: "cpo"
}

// 确认阶段
POST /api/trpc/workflows.approveStage
{
  workflowId: 1,
  stageId: "cpo"
}
```

### AI Agent API

```typescript
// 执行 AI 任务
POST /api/trpc/agents.executeTask
{
  role: "CPO",
  prompt: "分析用户需求...",
  context: { /* 上下文 */ }
}

// 继续对话
POST /api/trpc/agents.continueConversation
{
  taskId: 1,
  message: "请详细说明..."
}

// 获取任务历史
GET /api/trpc/agents.getHistory?taskId=1
```

## 🐛 故障排查

### 数据库连接失败
```bash
# 检查 MySQL 是否运行
docker ps | grep mysql

# 检查连接字符串
echo $DATABASE_URL
```

### OpenAI API 错误
```bash
# 检查 API 密钥
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Ollama 连接失败
```bash
# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags

# 拉取模型
ollama pull mistral
```

## 📈 生产部署

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看日志
pm2 logs
```

### 使用 Kubernetes

```bash
# 构建镜像
docker build -t dev-team:latest .

# 推送到仓库
docker tag dev-team:latest your-registry/dev-team:latest
docker push your-registry/dev-team:latest

# 部署到 K8s
kubectl apply -f k8s/deployment.yaml
```

## 🔐 安全建议

1. **更改所有默认密钥和密码**
2. **使用 HTTPS 和 SSL 证书**
3. **定期备份数据库**
4. **限制 API 访问 IP**
5. **启用 WAF 和 DDoS 防护**
6. **定期更新依赖**

## 📞 支持和贡献

- 提交 Issue: https://github.com/williiamwang/multi-agent-dev-team/issues
- 提交 PR: https://github.com/williiamwang/multi-agent-dev-team/pulls
- 讨论: https://github.com/williiamwang/multi-agent-dev-team/discussions

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙏 致谢

感谢所有开源项目的贡献者，本系统基于以下项目：
- React
- Express.js
- Drizzle ORM
- OpenAI
- Ollama
- MinIO
- Docker

---

**立即开始**：`docker-compose up -d` 🚀
