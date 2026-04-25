# 多智能体开发团队系统 - 完整集成指南

## 概述

本系统已完成三个关键的后续建议实现：

1. **完善通知集成** - 将邮件和 WebSocket 通知连接到工作流事件
2. **添加实时协作** - 实现 WebSocket 实时同步多用户编辑
3. **集成 GitHub/GitLab** - 自动拉取代码信息

## 1. 完善通知集成

### 工作流事件系统

系统在以下关键节点自动发送通知：

#### 1.1 阶段完成通知

当工作流的某个阶段完成时：

```typescript
import { emitStageCompleted } from './server/events/workflowEvents';

// 触发阶段完成事件
await emitStageCompleted(workflowId, 'architecture', 'architecture-stage-1');
```

**通知内容**：
- WebSocket 实时通知：项目所有者
- 邮件通知：项目所有者邮箱

#### 1.2 老板确认节点通知

当工作流需要老板确认时：

```typescript
import { emitApprovalNodePending } from './server/events/workflowEvents';

// 触发确认节点事件
await emitApprovalNodePending(workflowId, 'architecture');
```

**通知内容**：
- WebSocket 实时通知：项目所有者
- 邮件通知：项目所有者邮箱

#### 1.3 Bug 分配通知

当 Bug 分配给开发者时：

```typescript
import { emitBugAssigned } from './server/events/workflowEvents';

// 触发 Bug 分配事件
await emitBugAssigned(bugId, developerId, 'Login 功能崩溃');
```

**通知内容**：
- WebSocket 实时通知：开发者
- 邮件通知：开发者邮箱

#### 1.4 争议升级通知

当争议升级到 Architect 仲裁时：

```typescript
import { emitDisputeEscalated } from './server/events/workflowEvents';

// 触发争议升级事件
await emitDisputeEscalated(disputeId, architectId, pmId, devId);
```

**通知内容**：
- WebSocket 实时通知：Architect、PM、Dev
- 邮件通知：相关人员邮箱

#### 1.5 工作流完成通知

当整个工作流完成时：

```typescript
import { emitWorkflowCompleted } from './server/events/workflowEvents';

// 触发工作流完成事件
await emitWorkflowCompleted(workflowId);
```

**通知内容**：
- WebSocket 广播通知：所有连接的用户
- 邮件通知：项目所有者邮箱

### 配置邮件服务

在 `.env` 中配置 SMTP：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
```

## 2. 实时协作系统

### 创建协作会话

```typescript
import { collaborationManager } from './server/collaboration/realtime';

// 创建文档协作会话
const session = collaborationManager.createSession(documentId, 'document');

// 创建任务协作会话
const taskSession = collaborationManager.createSession(taskId, 'task');
```

### 用户加入协作

```typescript
// 用户加入会话
collaborationManager.joinSession(session.id, userId, userName);

// 用户离开会话
collaborationManager.leaveSession(session.id, userId);
```

### 应用编辑操作

```typescript
// 应用插入操作
const operation = {
  id: 'op-1',
  userId: 1,
  type: 'insert' as const,
  position: 10,
  content: 'Hello World',
  timestamp: Date.now(),
  version: 0,
};

const result = collaborationManager.applyOperation(session.id, operation);
```

### 更新光标位置

```typescript
// 更新用户光标位置
collaborationManager.updateCursor(session.id, userId, line, column);
```

### 获取会话状态

```typescript
// 获取会话当前状态
const state = collaborationManager.getSessionState(session.id);

// 获取操作历史
const history = collaborationManager.getOperationHistory(session.id);

// 获取冲突日志
const conflicts = collaborationManager.getConflictLog();
```

### 冲突解决算法

系统使用 **操作转换（OT）算法** 自动解决冲突：

1. **同位置冲突**：按用户 ID 排序，优先级高的用户操作优先
2. **范围冲突**：自动调整操作位置
3. **插入-删除冲突**：调整删除范围

## 3. GitHub/GitLab 集成

### GitHub 集成

#### 初始化 GitHub 集成

```typescript
import { createGitHubIntegration } from './server/integrations/github';

const github = createGitHubIntegration({
  token: process.env.GITHUB_TOKEN,
  owner: 'your-org',
  repo: 'your-repo',
});
```

#### 获取 PR 列表

```typescript
// 获取所有开放的 PR
const prs = await github.getPullRequests('open');

// 获取所有已关闭的 PR
const closedPrs = await github.getPullRequests('closed');

// 获取特定 PR 的详细信息
const prDetails = await github.getPullRequestDetails(123);
```

**返回数据结构**：

```typescript
{
  id: 123,
  title: 'Add new feature',
  description: 'This PR adds...',
  author: 'john-doe',
  status: 'open' | 'closed' | 'merged',
  createdAt: Date,
  updatedAt: Date,
  url: 'https://github.com/...',
  files: 5,
  additions: 150,
  deletions: 30
}
```

#### 获取 Issue 列表

```typescript
// 获取所有开放的 Issue
const issues = await github.getIssues('open');

// 获取所有已关闭的 Issue
const closedIssues = await github.getIssues('closed');
```

#### 获取 Commit 列表

```typescript
// 获取最近 10 个 Commit
const commits = await github.getCommits('main', 10);
```

### GitLab 集成

#### 初始化 GitLab 集成

```typescript
import { createGitLabIntegration } from './server/integrations/github';

const gitlab = createGitLabIntegration({
  token: process.env.GITLAB_TOKEN,
  projectId: 'your-project-id',
});
```

#### 获取 MR 列表

```typescript
// 获取所有开放的 MR
const mrs = await gitlab.getMergeRequests('opened');

// 获取所有已合并的 MR
const mergedMrs = await gitlab.getMergeRequests('merged');
```

#### 获取 Issue 列表

```typescript
// 获取所有开放的 Issue
const issues = await gitlab.getIssues('opened');
```

#### 获取 Commit 列表

```typescript
// 获取最近 10 个 Commit
const commits = await gitlab.getCommits('main', 10);
```

### 创建 tRPC 路由集成

```typescript
// server/routers/integrations.ts
import { publicProcedure, router } from '../_core/trpc';
import { createGitHubIntegration } from '../integrations/github';
import { z } from 'zod';

export const integrationsRouter = router({
  github: router({
    getPullRequests: publicProcedure
      .input(z.object({ state: z.enum(['open', 'closed', 'all']).optional() }))
      .query(async ({ input }) => {
        const github = createGitHubIntegration({
          token: process.env.GITHUB_TOKEN!,
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
        });

        return await github.getPullRequests(input.state || 'open');
      }),

    getIssues: publicProcedure
      .input(z.object({ state: z.enum(['open', 'closed', 'all']).optional() }))
      .query(async ({ input }) => {
        const github = createGitHubIntegration({
          token: process.env.GITHUB_TOKEN!,
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
        });

        return await github.getIssues(input.state || 'open');
      }),

    getCommits: publicProcedure
      .input(z.object({ branch: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const github = createGitHubIntegration({
          token: process.env.GITHUB_TOKEN!,
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
        });

        return await github.getCommits(input.branch || 'main', input.limit || 10);
      }),
  }),
});
```

### 在前端使用

```typescript
// client/src/pages/Integrations.tsx
import { trpc } from '@/lib/trpc';

export default function IntegrationsPage() {
  const { data: prs } = trpc.integrations.github.getPullRequests.useQuery({ state: 'open' });
  const { data: issues } = trpc.integrations.github.getIssues.useQuery({ state: 'open' });
  const { data: commits } = trpc.integrations.github.getCommits.useQuery({ branch: 'main', limit: 10 });

  return (
    <div>
      <h2>GitHub 集成</h2>
      <div>
        <h3>Pull Requests ({prs?.length || 0})</h3>
        {prs?.map((pr) => (
          <div key={pr.id}>
            <a href={pr.url}>{pr.title}</a>
            <p>by {pr.author}</p>
          </div>
        ))}
      </div>

      <div>
        <h3>Issues ({issues?.length || 0})</h3>
        {issues?.map((issue) => (
          <div key={issue.id}>
            <a href={issue.url}>{issue.title}</a>
            <p>by {issue.author}</p>
          </div>
        ))}
      </div>

      <div>
        <h3>Recent Commits ({commits?.length || 0})</h3>
        {commits?.map((commit) => (
          <div key={commit.sha}>
            <a href={commit.url}>{commit.message}</a>
            <p>by {commit.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 环境变量配置

```env
# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com

# GitHub 配置
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo

# GitLab 配置
GITLAB_TOKEN=your-gitlab-token
GITLAB_PROJECT_ID=your-project-id
GITLAB_BASE_URL=https://gitlab.com/api/v4
```

## 最佳实践

### 1. 通知系统

- 在关键工作流节点触发通知
- 使用 WebSocket 实现实时推送
- 邮件作为备用通知方式
- 实现通知去重和频率限制

### 2. 实时协作

- 使用 OT 算法自动解决冲突
- 记录所有操作历史用于审计
- 定期保存协作状态到数据库
- 实现操作撤销/重做功能

### 3. 代码集成

- 定期同步代码信息（每 5-10 分钟）
- 缓存 API 响应以减少请求
- 实现错误重试机制
- 监控 API 配额使用情况

## 故障排查

### 邮件无法发送

1. 检查 SMTP 配置是否正确
2. 验证邮箱账户和密码
3. 检查防火墙是否阻止 SMTP 端口
4. 查看服务器日志中的错误信息

### 实时协作冲突

1. 检查操作历史是否完整
2. 验证冲突解决算法的逻辑
3. 查看冲突日志了解冲突类型
4. 考虑实现操作合并策略

### GitHub/GitLab API 错误

1. 验证 API Token 是否有效
2. 检查 API 配额使用情况
3. 确认项目权限设置正确
4. 查看 API 响应中的错误信息

## 下一步

1. **WebSocket 实时通知** - 集成 Socket.IO 实现真正的实时推送
2. **操作撤销/重做** - 在实时协作中实现完整的编辑历史
3. **自动化同步** - 定期自动同步 GitHub/GitLab 信息
4. **权限管理** - 实现细粒度的协作权限控制
5. **性能优化** - 实现操作压缩和增量同步
