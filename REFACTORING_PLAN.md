# 系统架构重构计划 - 移除 Manus 依赖

## 目标

将多智能体开发团队工作流系统从 Manus 平台特定实现改造为**完全独立的通用系统**，使用标准开源技术栈，确保可在任何服务器上独立部署运行。

---

## 现有 Manus 依赖分析

### 1. 认证系统（Authentication）

**当前实现**：
- Manus OAuth 2.0 集成
- 文件：`server/_core/oauth.ts`、`server/_core/context.ts`
- 依赖：`VITE_APP_ID`、`OAUTH_SERVER_URL`、`VITE_OAUTH_PORTAL_URL`

**问题**：
- 完全依赖 Manus OAuth 服务
- 无法在其他平台上使用
- 用户信息存储在 Manus 系统中

**替代方案**：
- ✅ 标准 JWT (JSON Web Tokens)
- ✅ 支持多种登录方式（用户名/密码、邮件、GitHub OAuth）
- ✅ 本地用户数据库管理
- ✅ 刷新令牌机制

---

### 2. AI Agent 调度系统（AI Agent Orchestration）

**当前实现**：
- Manus API 调用
- 文件：`server/manus.ts`、`server/agents.ts`
- 依赖：`BUILT_IN_FORGE_API_URL`、`BUILT_IN_FORGE_API_KEY`

**问题**：
- 完全依赖 Manus 的 AI 任务执行服务
- 无法使用其他 LLM 提供商
- 任务执行结果存储在 Manus 系统中

**替代方案**：
- ✅ OpenAI API（GPT-4、GPT-3.5）
- ✅ 开源模型（Llama 2、Mistral）
- ✅ 本地 LLM 服务（Ollama）
- ✅ 通用的 Agent 框架（LangChain、AutoGPT）

---

### 3. 文件存储系统（File Storage）

**当前实现**：
- Manus S3 存储
- 文件：`server/storage.ts`、`server/_core/storageProxy.ts`
- 依赖：`BUILT_IN_FORGE_API_URL`、`BUILT_IN_FORGE_API_KEY`

**问题**：
- 所有文件存储在 Manus S3
- 无法离线使用
- 文件访问受 Manus 限制

**替代方案**：
- ✅ 本地文件系统存储
- ✅ MinIO（兼容 S3 的开源对象存储）
- ✅ AWS S3（可选）
- ✅ 支持多种存储后端的抽象层

---

### 4. 通知系统（Notification System）

**当前实现**：
- Manus 内置通知 API
- 文件：`server/_core/notification.ts`
- 依赖：`BUILT_IN_FORGE_API_URL`、`BUILT_IN_FORGE_API_KEY`

**问题**：
- 通知只能发送给 Manus 项目 Owner
- 无法自定义通知渠道
- 无法离线使用

**替代方案**：
- ✅ 邮件通知（SMTP）
- ✅ WebSocket 实时通知
- ✅ 短信通知（Twilio）
- ✅ 钉钉/企业微信集成

---

### 5. 环境变量和配置

**当前 Manus 特定的环境变量**：
```
VITE_APP_ID
VITE_APP_LOGO
VITE_APP_TITLE
OAUTH_SERVER_URL
VITE_OAUTH_PORTAL_URL
OWNER_NAME
OWNER_OPEN_ID
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_URL
VITE_ANALYTICS_ENDPOINT
VITE_ANALYTICS_WEBSITE_ID
```

**替代方案**：
- ✅ 标准配置文件（`.env`）
- ✅ 数据库配置
- ✅ 邮件服务配置
- ✅ LLM 服务配置
- ✅ 存储服务配置

---

## 重构路线图

### 第 1 阶段：认证系统重构

**目标**：实现标准 JWT 认证，支持多种登录方式

**工作项**：
- [ ] 创建 `server/auth/jwt.ts` - JWT 令牌生成和验证
- [ ] 创建 `server/auth/strategies.ts` - 多种认证策略
- [ ] 创建 `server/auth/local.ts` - 本地用户名/密码认证
- [ ] 创建 `server/auth/oauth.ts` - 通用 OAuth 2.0 支持
- [ ] 更新 `server/_core/context.ts` - 使用 JWT 替代 Manus OAuth
- [ ] 更新 `drizzle/schema.ts` - 添加密码字段到 users 表
- [ ] 创建迁移脚本 - 从 Manus 用户迁移到本地用户

**依赖包**：
```json
{
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "passport": "^0.6.0",
  "passport-local": "^1.0.0",
  "passport-oauth2": "^1.7.0"
}
```

---

### 第 2 阶段：AI Agent 调度系统重构

**目标**：实现通用的 AI Agent 调度，支持多个 LLM 提供商

**工作项**：
- [ ] 创建 `server/llm/provider.ts` - LLM 提供商抽象层
- [ ] 创建 `server/llm/openai.ts` - OpenAI 集成
- [ ] 创建 `server/llm/ollama.ts` - 本地 Ollama 集成
- [ ] 创建 `server/agents/executor.ts` - Agent 执行引擎
- [ ] 创建 `server/agents/prompts.ts` - Agent Persona 提示词
- [ ] 更新 `server/workflow.ts` - 使用新的 Agent 执行系统
- [ ] 创建迁移脚本 - 从 Manus API 迁移到本地 LLM

**依赖包**：
```json
{
  "openai": "^4.0.0",
  "langchain": "^0.1.0",
  "axios": "^1.6.0"
}
```

---

### 第 3 阶段：文件存储系统重构

**目标**：实现灵活的文件存储，支持本地和 MinIO

**工作项**：
- [ ] 创建 `server/storage/provider.ts` - 存储提供商抽象层
- [ ] 创建 `server/storage/local.ts` - 本地文件系统存储
- [ ] 创建 `server/storage/minio.ts` - MinIO 存储
- [ ] 创建 `server/storage/s3.ts` - AWS S3 存储（可选）
- [ ] 更新 `server/storage.ts` - 使用新的存储系统
- [ ] 创建迁移脚本 - 从 Manus S3 下载文件到本地

**依赖包**：
```json
{
  "minio": "^7.1.0",
  "aws-sdk": "^2.1.0"
}
```

---

### 第 4 阶段：通知系统重构

**目标**：实现多渠道通知，支持邮件和 WebSocket

**工作项**：
- [ ] 创建 `server/notifications/provider.ts` - 通知提供商抽象层
- [ ] 创建 `server/notifications/email.ts` - 邮件通知
- [ ] 创建 `server/notifications/websocket.ts` - WebSocket 实时通知
- [ ] 创建 `server/notifications/sms.ts` - 短信通知（可选）
- [ ] 更新 `server/routers/notifications.ts` - 集成新的通知系统
- [ ] 更新前端 - 实现 WebSocket 连接和通知显示

**依赖包**：
```json
{
  "nodemailer": "^6.9.0",
  "socket.io": "^4.6.0",
  "twilio": "^3.9.0"
}
```

---

### 第 5 阶段：环境配置重构

**目标**：实现标准的配置管理系统

**工作项**：
- [ ] 创建 `.env.example` - 配置模板
- [ ] 创建 `server/config/index.ts` - 配置管理
- [ ] 创建 `server/config/validation.ts` - 配置验证
- [ ] 更新所有模块 - 使用新的配置系统
- [ ] 创建部署文档 - 配置说明

**配置文件示例**：
```env
# 数据库
DATABASE_URL=mysql://user:password@localhost:3306/dev_team

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d

# 邮件
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# LLM
LLM_PROVIDER=openai  # openai, ollama, local
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# 存储
STORAGE_PROVIDER=local  # local, minio, s3
STORAGE_PATH=/data/uploads

# 应用
APP_PORT=3000
APP_HOST=localhost
NODE_ENV=development
```

---

### 第 6 阶段：测试和文档

**目标**：完整的测试覆盖和部署文档

**工作项**：
- [ ] 编写单元测试 - 认证、存储、通知
- [ ] 编写集成测试 - 完整工作流
- [ ] 编写 E2E 测试 - 用户场景
- [ ] 创建部署指南 - Docker、Kubernetes、VPS
- [ ] 创建配置指南 - 各种环境配置
- [ ] 创建迁移指南 - 从 Manus 迁移到独立部署

---

## 技术栈对比

| 功能 | 当前（Manus） | 新方案 |
|------|---------------|--------|
| 认证 | Manus OAuth | JWT + Passport |
| AI 模型 | Manus Forge API | OpenAI / Ollama / 本地 |
| 文件存储 | Manus S3 | 本地 / MinIO / S3 |
| 通知 | Manus API | 邮件 / WebSocket / SMS |
| 数据库 | MySQL/TiDB | MySQL / PostgreSQL / SQLite |
| 部署 | Manus 平台 | Docker / VPS / K8s |

---

## 迁移计划

### 数据迁移
1. 导出现有用户数据
2. 导出现有文档和任务数据
3. 迁移到本地数据库
4. 验证数据完整性

### 功能迁移
1. 实现新的认证系统
2. 实现新的 AI Agent 执行系统
3. 实现新的存储系统
4. 实现新的通知系统
5. 逐步替换旧系统

### 测试验证
1. 单元测试
2. 集成测试
3. E2E 测试
4. 性能测试
5. 安全审计

---

## 预期收益

✅ **完全独立** - 不依赖任何第三方平台  
✅ **灵活可扩展** - 支持多种 LLM 和存储后端  
✅ **成本低廉** - 可使用开源或低成本方案  
✅ **数据隐私** - 所有数据存储在自己的服务器上  
✅ **离线可用** - 可完全离线部署和运行  
✅ **社区支持** - 使用广泛使用的开源技术  

---

## 时间估计

| 阶段 | 工作量 | 时间 |
|------|--------|------|
| 1. 认证系统 | 中等 | 2-3 天 |
| 2. AI Agent 系统 | 高 | 3-4 天 |
| 3. 文件存储 | 中等 | 2 天 |
| 4. 通知系统 | 中等 | 2 天 |
| 5. 配置管理 | 低 | 1 天 |
| 6. 测试和文档 | 中等 | 2-3 天 |
| **总计** | | **12-16 天** |

---

## 下一步

1. 确认重构方向和优先级
2. 开始第 1 阶段（认证系统）
3. 逐步推进其他阶段
4. 完成测试和文档
5. 发布独立版本

