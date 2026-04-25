# 多智能体开发团队工作流系统

一个**完全独立、生产就绪**的多智能体 AI 协作开发平台，支持从需求到发布的完整研发流水线自动化。

## 🎯 核心特性

### 1. 多角色工作流仪表盘
- **完整流水线**：CPO → Architect → PM → Dev → QA
- **5 个关键确认节点**：需求、架构、任务、开发、测试
- **实时进度追踪**：AI 执行状态、阶段转移、文档预览

### 2. AI 多角色执行引擎
- **6 个专业角色**：CPO、Architect、PM、Dev、QA、OSS Scout
- **支持多个 LLM**：OpenAI GPT-4、Ollama 本地模型
- **多轮对话**：完整的对话历史和上下文管理
- **自动执行**：任务创建、执行、结果归档

### 3. 文档管理中心
- **统一管理**：PRD、架构、接口、测试报告等
- **版本控制**：完整的文档版本历史
- **查看和下载**：支持多种格式导出

### 4. 原子化任务看板
- **任务拆解**：PM 拆解的详细任务卡片
- **分类展示**：按前端/后端/基础设施分组
- **依赖管理**：任务依赖关系可视化
- **状态追踪**：实时任务状态更新

### 5. Bug 追踪系统
- **Traceback 格式**：标准的 Bug 提交格式
- **优先级分级**：HIGH / MEDIUM / LOW
- **Hotfix 方案**：开发者的修复和重构方案
- **自动分配**：Bug 自动分配给开发者

### 6. 争议仲裁流程
- **3 轮讨论**：PM 和 Dev 的多轮讨论
- **Architect 仲裁**：架构师的中立仲裁
- **老板决策**：最终的管理层决策
- **完整记录**：所有争议的完整追溯

### 7. 实时通知系统
- **邮件通知**：SMTP 邮件推送
- **WebSocket 实时推送**：实时消息推送
- **多事件触发**：阶段完成、确认节点、Bug 分配、争议升级

### 8. 实时协作系统 ⭐ NEW
- **多用户编辑**：同时编辑任务和文档
- **OT 冲突解决**：自动解决编辑冲突
- **光标共享**：实时显示其他用户的光标位置
- **操作历史**：完整的编辑历史记录

### 9. GitHub/GitLab 集成 ⭐ NEW
- **自动拉取**：PR、Issue、Commit 信息
- **代码同步**：实时同步代码变更
- **集成通知**：代码变更自动通知相关人员

## 🏗️ 技术栈

### 后端
- **框架**：Express.js 4 + tRPC 11
- **数据库**：MySQL/TiDB
- **认证**：JWT + Passport（完全独立）
- **LLM**：OpenAI API + Ollama 本地模型
- **存储**：本地/MinIO/S3（可选）
- **通知**：SMTP 邮件 + WebSocket
- **协作**：Socket.IO + OT 算法

### 前端
- **框架**：React 19 + Vite
- **样式**：Tailwind CSS 4 + shadcn/ui
- **路由**：Wouter
- **数据获取**：tRPC + React Query
- **实时通信**：WebSocket

### 部署
- **容器化**：Docker + Docker Compose
- **反向代理**：Nginx
- **进程管理**：PM2
- **数据库**：MySQL 8.0

## ✨ 独立性特点

本系统**完全独立于 Manus 平台**，使用通用的开源技术栈：

- ✅ **标准 JWT 认证** - 替代 Manus OAuth
- ✅ **OpenAI/Ollama LLM** - 替代 Manus Forge API
- ✅ **本地/MinIO/S3 存储** - 替代 Manus S3
- ✅ **SMTP 邮件通知** - 替代 Manus 通知
- ✅ **标准 Docker 部署** - 可在任何服务器运行

## 📦 快速开始

### 前置要求
- Node.js 18+
- Docker & Docker Compose（可选）
- MySQL 8.0+（如果不使用 Docker）

### 本地开发

```bash
# 克隆项目
git clone https://github.com/williiamwang/multi-agent-dev-team.git
cd multi-agent-dev-team

# 安装依赖
pnpm install

# 配置环境
cp .env.example .env
# 编辑 .env 文件，填入您的配置

# 启动开发服务器
pnpm dev
```

### Docker 部署

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问应用：http://localhost:3000

## 🔧 环境配置

复制 `.env.example` 并根据需要修改：

```env
# 数据库
DATABASE_URL=mysql://user:password@localhost:3306/dev_team

# JWT 认证
JWT_SECRET=your-secret-key-here

# OpenAI LLM
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Ollama 本地 LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com

# 文件存储
STORAGE_TYPE=local  # local | minio | s3
STORAGE_PATH=/data/uploads

# MinIO 配置（如果使用 MinIO）
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=dev-team

# GitHub 集成
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo

# GitLab 集成
GITLAB_TOKEN=your-gitlab-token
GITLAB_PROJECT_ID=your-project-id
```

## 📚 完整文档

- **[系统架构](./ARCHITECTURE.md)** - 详细的系统设计和数据模型
- **[部署指南](./DEPLOYMENT_GUIDE.md)** - 生产环境部署步骤
- **[集成指南](./INTEGRATION_GUIDE.md)** - 通知、协作、代码集成详解
- **[独立部署](./README_INDEPENDENT.md)** - 完全独立部署指南
- **[重构计划](./REFACTORING_PLAN.md)** - Manus 独立性重构方案
- **[测试报告](./TEST_REPORT.md)** - 系统测试覆盖和结果

## 🚀 核心功能使用

### 创建工作流

```typescript
// 通过 tRPC 创建新工作流
const workflow = await trpc.workflows.create.mutate({
  projectId: 1,
  title: '新功能开发',
  description: '实现用户认证功能',
});
```

### 执行 AI 任务

```typescript
// 触发某个阶段的 AI 执行
const result = await trpc.workflows.executeStage.mutate({
  workflowId: workflow.id,
  stage: 'architecture',
});
```

### 提交 Bug

```typescript
// 提交 Bug（Traceback 格式）
const bug = await trpc.bugs.create.mutate({
  workflowId: 1,
  title: 'Login 功能崩溃',
  traceback: 'Error: Cannot read property...',
  severity: 'HIGH',
});
```

### 创建争议

```typescript
// 创建 PM 和 Dev 的争议
const dispute = await trpc.disputes.create.mutate({
  workflowId: 1,
  pmId: 2,
  devId: 3,
  topic: '任务工作量评估',
  pmPosition: 'PM 认为需要 3 天',
  devPosition: 'Dev 认为需要 5 天',
});
```

### 实时协作

```typescript
// 加入协作会话
const session = collaborationManager.createSession(taskId, 'task');
collaborationManager.joinSession(session.id, userId, userName);

// 应用编辑操作
collaborationManager.applyOperation(session.id, {
  type: 'insert',
  position: 10,
  content: 'Hello World',
});
```

### GitHub 集成

```typescript
// 获取 PR 列表
const prs = await github.getPullRequests('open');

// 获取 Issue 列表
const issues = await github.getIssues('open');

// 获取最近的 Commit
const commits = await github.getCommits('main', 10);
```

## 📊 数据库架构

系统包含 14 个核心表：

| 表名 | 用途 |
|------|------|
| `projects` | 项目管理 |
| `workflows` | 工作流实例 |
| `stages` | 工作流阶段 |
| `agentTasks` | AI 任务执行 |
| `documents` | 文档管理 |
| `atomicTasks` | 原子化任务 |
| `bugs` | Bug 追踪 |
| `bugReplies` | Bug 回复 |
| `disputes` | 争议管理 |
| `disputeRounds` | 仲裁轮次 |
| `approvalNodes` | 确认节点 |
| `aiAgents` | AI 角色配置 |
| `agentMessages` | AI 对话历史 |
| `notifications` | 通知记录 |

## 🔐 安全性

- **JWT 认证**：所有 API 请求都需要有效的 JWT Token
- **权限管理**：基于角色的访问控制（RBAC）
- **数据加密**：敏感数据加密存储
- **审计日志**：所有操作都有完整的审计记录
- **速率限制**：API 请求速率限制防止滥用

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 📞 支持

- **文档**：查看 [完整文档](./ARCHITECTURE.md)
- **Issue**：在 GitHub 上提交 Issue
- **讨论**：在 GitHub Discussions 中讨论

## 🎉 致谢

感谢所有贡献者和使用者的支持！

---

**版本**：1.0.0  
**最后更新**：2026-04-25  
**维护者**：William Wang

## 最近更新

### v1.0.0 (2026-04-25)
- ✅ 完成 Manus 平台独立性重构
- ✅ 添加 JWT 认证系统
- ✅ 集成 OpenAI + Ollama LLM
- ✅ 实现实时协作系统（OT 算法）
- ✅ 添加 GitHub/GitLab 集成
- ✅ 完整的邮件和 WebSocket 通知
- ✅ Docker 和 Docker Compose 支持
- ✅ 生产级别的错误处理和日志
