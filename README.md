# 多智能体开发团队工作流系统

一个面向 AI 多角色协作开发流程的工作流仪表盘平台，通过 Manus API 驱动各角色 AI Agent 自动执行，支持完整的 CPO → Architect → PM → Dev → QA 研发流水线。

## 系统架构

### 核心特性

1. **多角色工作流仪表盘**
   - CPO（需求挖掘）→ Architect（架构设计）→ PM（任务拆解）→ Dev（开发）→ QA（测试）
   - 完整的流水线可视化和阶段管理
   - 5 个关键节点的老板确认门控

2. **AI 角色执行引擎**
   - 通过 Manus API 为每个角色创建独立的 AI Agent 项目
   - 支持多轮对话、任务状态轮询和结果文档自动归档
   - 6 个专业 AI 角色：CPO、Architect、PM、Dev、QA、OSS Scout

3. **文档管理中心**
   - 统一管理各阶段输出文档
   - 支持 PRD、架构图、接口契约、任务清单、测试报告等
   - 文档版本管理和下载功能

4. **原子化任务看板**
   - PM 拆解的任务卡片展示
   - 按前端/后端/基础设施分组展示
   - 任务依赖关系管理

5. **Bug 追踪系统**
   - QA 以 Traceback 格式提交 Bug
   - Dev 进行 Hotfix 或重构方案回复
   - 严重程度分级（HIGH/MEDIUM/LOW）

6. **争议仲裁流程**
   - Dev 与 PM 意见冲突时的升级链路
   - 最多 3 轮讨论 → Architect 仲裁 → 老板决策
   - 完整的仲裁记录和决策追溯

7. **实时任务状态通知**
   - 各阶段完成时自动推送提醒
   - 老板确认节点触发通知
   - 支持通知标记已读和管理

## 技术栈

### 后端
- **框架**: Express.js + tRPC
- **数据库**: MySQL/TiDB（Drizzle ORM）
- **认证**: Manus OAuth
- **API**: RESTful + tRPC

### 前端
- **框架**: React 19 + Vite
- **样式**: Tailwind CSS 4
- **UI 组件**: shadcn/ui
- **路由**: Wouter

### 外部服务
- **Manus API**: AI Agent 创建、任务执行、消息轮询
- **数据存储**: S3（文件存储）
- **通知系统**: 内置通知 API

## 数据库架构

### 核心表

| 表名 | 用途 |
|------|------|
| `projects` | 项目信息 |
| `workflows` | 工作流实例 |
| `stages` | 工作流阶段 |
| `agentTasks` | AI 任务执行 |
| `documents` | 阶段输出文档 |
| `atomicTasks` | 原子化任务 |
| `bugs` | 缺陷追踪 |
| `bugReplies` | 缺陷回复 |
| `disputes` | 争议管理 |
| `disputeRounds` | 仲裁轮次 |
| `approvalNodes` | 确认节点 |
| `aiAgents` | AI 角色配置 |
| `agentMessages` | AI 对话历史 |
| `notifications` | 通知记录 |

## API 路由

### 工作流管理
- `POST /api/trpc/workflows.create` - 创建工作流
- `GET /api/trpc/workflows.getById` - 获取工作流详情
- `GET /api/trpc/workflows.listByProject` - 列出项目工作流
- `POST /api/trpc/workflows.approveStage` - 老板确认阶段

### 文档管理
- `GET /api/trpc/documents.listByWorkflow` - 列出工作流文档
- `GET /api/trpc/documents.getById` - 获取文档详情
- `POST /api/trpc/documents.upsert` - 创建/更新文档

### 任务管理
- `GET /api/trpc/tasks.listByWorkflow` - 列出工作流任务
- `GET /api/trpc/tasks.getById` - 获取任务详情
- `POST /api/trpc/tasks.updateStatus` - 更新任务状态
- `GET /api/trpc/tasks.listByCategory` - 按分类列出任务

### Bug 追踪
- `POST /api/trpc/bugs.submit` - 提交 Bug
- `GET /api/trpc/bugs.listByWorkflow` - 列出工作流 Bug
- `GET /api/trpc/bugs.getById` - 获取 Bug 详情
- `POST /api/trpc/bugs.updateStatus` - 更新 Bug 状态
- `POST /api/trpc/bugs.submitReply` - 提交 Bug 回复
- `GET /api/trpc/bugs.getReplies` - 获取 Bug 回复

### 争议管理
- `POST /api/trpc/disputes.create` - 创建争议
- `GET /api/trpc/disputes.listByWorkflow` - 列出工作流争议
- `GET /api/trpc/disputes.getById` - 获取争议详情
- `POST /api/trpc/disputes.submitRound` - 提交讨论轮次
- `GET /api/trpc/disputes.getRounds` - 获取讨论轮次
- `POST /api/trpc/disputes.submitArchitectDecision` - Architect 仲裁
- `POST /api/trpc/disputes.submitOwnerDecision` - 老板决策

## 前端页面

### 主要模块

1. **首页** (`/`)
   - 功能导航卡片
   - 登录入口

2. **工作流仪表盘** (`/dashboard`)
   - 工作流时间线
   - 阶段卡片和状态
   - 老板确认节点
   - 快速操作

3. **文档管理** (`/documents`)
   - 文档列表
   - 文档查看器
   - 下载功能

4. **任务看板** (`/tasks`)
   - 任务列表
   - 分类筛选（前端/后端/基础设施）
   - 任务详情

5. **Bug 追踪** (`/bugs`)
   - Bug 列表（按严重程度排序）
   - Bug 详情
   - Traceback 展示
   - 修复回复

6. **争议仲裁** (`/disputes`)
   - 争议列表
   - 讨论轮次
   - Architect 仲裁
   - 老板决策

## AI Agent 角色定义

### CPO（Chief Product Officer）
- 职责：需求挖掘、PRD 编写
- 输出：完整的产品需求文档
- 确认节点：需求确认

### Architect（技术架构师）
- 职责：技术架构设计、技术方案评审
- 输出：架构设计文档、技术决策
- 确认节点：架构确认

### PM（产品经理）
- 职责：需求拆解、任务规划、依赖管理
- 输出：原子化任务清单、接口契约
- 确认节点：任务拆解确认

### Dev（开发工程师）
- 职责：代码实现、自测、Bug 修复
- 输出：代码、自测报告、修复方案
- 确认节点：开发完成确认

### QA（质量保证）
- 职责：测试执行、Bug 提交、质量把控
- 输出：测试报告、Bug 列表
- 确认节点：测试完成确认

### OSS Scout（开源技术调研）
- 职责：开源项目调研、技术方案对比
- 输出：调研报告、推荐方案、代码片段

## 工作流执行流程

```
1. 需求阶段 (CPO)
   ↓ [老板确认]
2. 架构阶段 (Architect)
   ↓ [老板确认]
3. 任务拆解 (PM)
   ↓ [老板确认]
4. 开发阶段 (Dev)
   ↓ [老板确认]
5. 测试阶段 (QA)
   ↓ [老板确认]
6. 发布阶段
```

### 争议处理流程

```
Dev 与 PM 意见冲突
   ↓
最多 3 轮讨论
   ↓
Architect 仲裁
   ↓
老板最终决策
   ↓
执行决策结果
```

## 环境变量

```env
# 数据库
DATABASE_URL=mysql://user:password@host:3306/database

# Manus OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Manus API
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# 应用配置
JWT_SECRET=your_jwt_secret
OWNER_OPEN_ID=owner_id
OWNER_NAME=Owner Name
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

### 运行测试

```bash
pnpm test
```

## 项目结构

```
multi-agent-dev-team/
├── client/                    # 前端应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # UI 组件
│   │   ├── lib/              # 工具函数
│   │   ├── App.tsx           # 路由配置
│   │   └── main.tsx          # 应用入口
│   └── public/               # 静态资源
├── server/                    # 后端应用
│   ├── routers/              # tRPC 路由
│   ├── db.ts                 # 数据库操作
│   ├── manus.ts              # Manus API 客户端
│   ├── agents.ts             # AI Agent 定义
│   ├── workflow.ts           # 工作流引擎
│   └── routers.ts            # 路由聚合
├── drizzle/                  # 数据库迁移
│   └── schema.ts             # 数据库 Schema
├── shared/                   # 共享代码
└── package.json
```

## 开发指南

### 添加新的工作流阶段

1. 在 `drizzle/schema.ts` 中更新 `stageType` 枚举
2. 在 `server/workflow.ts` 中更新 `STAGE_SEQUENCE` 和 `STAGE_ROLES`
3. 在 `server/agents.ts` 中添加对应的 AI Agent Persona
4. 在前端更新相关的显示文本和配置

### 添加新的 Bug 严重程度

1. 在 `drizzle/schema.ts` 中更新 `severity` 枚举
2. 在前端 Bug 页面中添加对应的颜色配置

### 扩展争议仲裁流程

修改 `server/routers/disputes.ts` 中的 `submitRound` 方法中的最大轮次限制。

## 性能优化

- 使用 tRPC 的查询缓存减少数据库查询
- 前端使用 React Query 的乐观更新提升用户体验
- 数据库索引优化常用查询字段
- S3 文件存储加速文档下载

## 安全考虑

- 所有 API 路由都通过 Manus OAuth 认证
- 使用 `protectedProcedure` 保护需要认证的操作
- 老板确认节点由 `ctx.user.id` 验证
- 文件下载通过 S3 预签名 URL 控制访问权限

## 故障排除

### 工作流卡住

检查 `agentTasks` 表中的任务状态，确保轮询服务正常运行。

### 文档无法下载

验证 S3 存储配置和文件 URL 是否有效。

### 通知未收到

检查 `notifications` 表和通知服务配置。

## 贡献指南

1. 创建功能分支
2. 提交更改
3. 创建 Pull Request

## 许可证

MIT

## 支持

如有问题，请通过 Manus 平台的反馈系统联系支持。
