# 多智能体开发团队工作流系统 - 架构设计文档

## 一、系统概览

本系统是一个**AI 驱动的多角色协作开发流程管理平台**，通过 Manus API 为每个角色（CPO、Architect、PM、Dev、QA、OSS Scout）创建独立的 AI Agent，自动执行各阶段工作，同时提供人工确认门控和争议仲裁机制。

### 核心流程

```
CPO (需求挖掘)
    ↓ [老板确认1]
Architect (架构设计)
    ↓ [老板确认2]
PM (任务拆解)
    ↓ [老板确认3]
Dev (开发+自测) ← OSS Scout (并行调研)
    ↓ [老板确认4]
QA (测试)
    ↓ [老板确认5]
发布
```

### 关键特性

1. **多阶段工作流**：7 个工作阶段 + 5 个老板确认节点
2. **AI 角色执行**：6 个独立的 Manus AI Agent，各具专业 Persona
3. **文档管理**：统一归档各阶段输出文档
4. **任务看板**：原子化任务卡片管理与依赖追踪
5. **Bug 追踪**：Traceback 格式的 Bug 提交与修复流程
6. **争议仲裁**：多轮讨论 → Architect 仲裁 → 老板决策
7. **实时通知**：关键节点自动推送通知

---

## 二、数据模型设计

### 2.1 核心实体关系

```
Project (项目)
├── Workflow (工作流实例)
│   ├── Stage (阶段)
│   │   ├── AgentTask (AI 任务)
│   │   ├── ApprovalNode (确认节点)
│   │   └── Document (输出文档)
│   ├── AtomicTask (原子化任务)
│   │   ├── TaskDependency (任务依赖)
│   │   └── TestCase (测试用例)
│   ├── Bug (缺陷)
│   │   ├── BugReply (修复回复)
│   │   └── BugComment (讨论)
│   ├── Dispute (争议)
│   │   └── DisputeRound (仲裁轮次)
│   └── Notification (通知)
└── AIAgent (AI 角色)
    ├── AgentProject (Manus 项目)
    └── AgentMessage (对话历史)
```

### 2.2 数据库表设计

#### 表 1：projects（项目表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR(255) | 项目名称 |
| description | TEXT | 项目描述 |
| ownerId | INT | 项目所有者 ID |
| status | ENUM | 项目状态：draft / active / completed / archived |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 表 2：workflows（工作流实例表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| projectId | INT | 关联项目 ID |
| currentStage | ENUM | 当前阶段：requirement / architecture / decomposition / development / testing / bugfix / release |
| status | ENUM | 工作流状态：pending / in_progress / paused / completed / failed |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 表 3：stages（阶段表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| workflowId | INT | 关联工作流 ID |
| stageType | ENUM | 阶段类型：requirement / architecture / decomposition / development / testing / bugfix / release |
| role | ENUM | 负责角色：CPO / Architect / PM / Dev / QA / OSS |
| status | ENUM | 阶段状态：pending / in_progress / completed / failed |
| startedAt | TIMESTAMP | 开始时间 |
| completedAt | TIMESTAMP | 完成时间 |

#### 表 4：agentTasks（AI 任务表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| stageId | INT | 关联阶段 ID |
| agentId | INT | 关联 AI Agent ID |
| manusTaskId | VARCHAR(255) | Manus API 返回的 task_id |
| prompt | LONGTEXT | 发送给 AI 的 Prompt |
| status | ENUM | 任务状态：created / running / completed / failed |
| result | LONGTEXT | AI 返回结果（JSON） |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 表 5：documents（文档表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| workflowId | INT | 关联工作流 ID |
| stageId | INT | 关联阶段 ID |
| docType | ENUM | 文档类型：PRD / Architecture / APIContract / TaskList / SelfTestReport / TestReport / ResearchReport |
| title | VARCHAR(255) | 文档标题 |
| content | LONGTEXT | 文档内容（Markdown） |
| fileUrl | VARCHAR(500) | 文件存储 URL |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 表 6：atomicTasks（原子化任务表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| workflowId | INT | 关联工作流 ID |
| taskId | VARCHAR(50) | 任务 ID（TASK-001） |
| taskName | VARCHAR(255) | 任务名称 |
| category | ENUM | 任务分类：frontend / backend / infrastructure |
| prerequisites | TEXT | 前置条件 |
| inputs | LONGTEXT | 输入参数（JSON） |
| outputs | LONGTEXT | 输出格式（JSON） |
| acceptanceCriteria | LONGTEXT | 验收标准（JSON 数组） |
| selfTestCases | LONGTEXT | 自测用例（JSON 数组） |
| dependencies | TEXT | 依赖任务 ID 列表（逗号分隔） |
| status | ENUM | 任务状态：pending / in_progress / completed / blocked |
| assignedTo | INT | 分配给的开发者 ID |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 表 7：bugs（缺陷表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| workflowId | INT | 关联工作流 ID |
| bugId | VARCHAR(50) | 缺陷 ID（BUG-001） |
| relatedTask | VARCHAR(50) | 关联任务 ID |
| severity | ENUM | 严重程度：HIGH / MEDIUM / LOW |
| reproducingSteps | LONGTEXT | 复现步骤 |
| expected | TEXT | 预期结果 |
| actual | TEXT | 实际结果 |
| traceback | LONGTEXT | Traceback 信息 |
| status | ENUM | 缺陷状态：open / in_progress / fixed / verified / closed |
| createdBy | INT | 提交者 ID（QA） |
| assignedTo | INT | 分配给的开发者 ID |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 表 8：bugReplies（缺陷回复表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| bugId | INT | 关联缺陷 ID |
| replyType | ENUM | 回复类型：hotfix / refactor_proposal |
| content | LONGTEXT | 回复内容 |
| createdBy | INT | 回复者 ID |
| createdAt | TIMESTAMP | 创建时间 |

#### 表 9：disputes（争议表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| workflowId | INT | 关联工作流 ID |
| relatedTask | VARCHAR(50) | 关联任务 ID |
| initiatedBy | INT | 发起者 ID |
| initiatedRole | ENUM | 发起角色：Dev / PM |
| issue | LONGTEXT | 争议问题描述 |
| status | ENUM | 争议状态：open / in_discussion / architect_review / owner_decision / resolved |
| roundCount | INT | 讨论轮次（0-3） |
| architectDecision | LONGTEXT | Architect 仲裁意见 |
| ownerDecision | LONGTEXT | 老板决策 |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 表 10：disputeRounds（仲裁轮次表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| disputeId | INT | 关联争议 ID |
| roundNumber | INT | 轮次号（1-3） |
| fromRole | ENUM | 发言角色：Dev / PM |
| content | LONGTEXT | 发言内容 |
| createdAt | TIMESTAMP | 创建时间 |

#### 表 11：approvalNodes（确认节点表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| workflowId | INT | 关联工作流 ID |
| nodeType | ENUM | 节点类型：requirement / architecture / decomposition / development / testing |
| stage | INT | 关联阶段 ID |
| status | ENUM | 节点状态：pending / approved / rejected |
| approvedBy | INT | 审批者 ID（老板） |
| approvalComment | TEXT | 审批意见 |
| approvedAt | TIMESTAMP | 审批时间 |
| createdAt | TIMESTAMP | 创建时间 |

#### 表 12：aiAgents（AI 角色表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| role | ENUM | 角色类型：CPO / Architect / PM / Dev / QA / OSS |
| persona | LONGTEXT | 角色 Persona 和工作规范 |
| manusProjectId | VARCHAR(255) | Manus API 项目 ID |
| status | ENUM | 状态：active / inactive |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 表 13：agentMessages（AI 对话历史表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| agentTaskId | INT | 关联 AI 任务 ID |
| role | ENUM | 消息角色：user / assistant |
| content | LONGTEXT | 消息内容 |
| attachments | JSON | 附件列表 |
| createdAt | TIMESTAMP | 创建时间 |

#### 表 14：notifications（通知表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| workflowId | INT | 关联工作流 ID |
| userId | INT | 接收者 ID |
| notificationType | ENUM | 通知类型：stage_completed / approval_required / bug_assigned / dispute_escalated |
| title | VARCHAR(255) | 通知标题 |
| content | TEXT | 通知内容 |
| relatedEntityId | INT | 关联实体 ID |
| status | ENUM | 通知状态：unread / read |
| createdAt | TIMESTAMP | 创建时间 |

---

## 三、Manus API 集成架构

### 3.1 AI Agent 创建流程

每个角色对应一个 Manus AI Agent Project，通过 `project.create` API 创建：

```typescript
// 示例：创建 CPO Agent
const cpoProject = await manusAPI.project.create({
  name: "CPO - 需求挖掘 Agent",
  instruction: `
    你是一位资深的首席产品官 (CPO)。
    你的职责是通过深度访谈挖掘用户需求，输出高质量的 PRD 文档。
    
    输出格式必须包括：
    1. 业务流程图（泳道图）
    2. 功能矩阵（功能名 | 优先级 | 输入 | 输出 | 异常处理）
    3. 非功能性需求（性能/安全/兼容性）
    4. 用户交互原型描述
    5. 数据持久化要求
    
    每条功能必须有明确的边界条件和异常场景。
  `
});
```

### 3.2 任务执行流程

```
1. 创建 Stage 记录
   ↓
2. 调用 Manus API task.create
   - 传入 Prompt（包含上一阶段的输出文档）
   - 关联 Project ID
   - 设置 Connectors（如需要访问外部服务）
   ↓
3. 保存 Manus Task ID 到 agentTasks 表
   ↓
4. 启动轮询循环
   - 定期调用 task.listMessages
   - 检查 agent_status 是否为 "stopped"
   ↓
5. 任务完成
   - 提取 assistant_message 内容
   - 保存到 documents 表
   - 触发老板确认节点
```

### 3.3 Manus API 调用示例

```typescript
// 创建任务
const task = await manusAPI.task.create({
  message: {
    content: [
      {
        type: "text",
        text: `基于以下用户需求，请输出完整的 PRD 文档：\n${userInput}`
      }
    ]
  },
  project_id: cpoProjectId,
  title: "PRD 需求文档生成 - 项目 ABC"
});

// 轮询结果
const messages = await manusAPI.task.listMessages({
  task_id: task.task_id,
  order: "asc"
});

// 检查完成状态
const statusMessage = messages.find(m => m.type === "status_update");
if (statusMessage?.agent_status === "stopped") {
  // 提取最终输出
  const finalOutput = messages
    .filter(m => m.type === "assistant_message")
    .pop()?.assistant_message.content;
}
```

---

## 四、工作流引擎设计

### 4.1 阶段转移规则

```
Stage 1: 需求挖掘 (CPO)
  ├─ 状态：pending → in_progress → completed
  ├─ 输出：PRD 文档
  ├─ 确认节点：老板确认需求
  └─ 转移条件：老板批准 → Stage 2

Stage 2: 架构设计 (Architect)
  ├─ 状态：pending → in_progress → completed
  ├─ 输出：技术架构图、接口契约、目录结构
  ├─ 确认节点：老板确认技术方案
  └─ 转移条件：老板批准 → Stage 3

Stage 3: 任务拆解 (PM)
  ├─ 状态：pending → in_progress → completed
  ├─ 输出：原子化任务清单
  ├─ 确认节点：老板确认拆解结果
  └─ 转移条件：老板批准 → Stage 4 & Stage 7

Stage 4: 开发 (Dev)
  ├─ 状态：pending → in_progress → completed
  ├─ 输出：代码、自测报告
  ├─ 确认节点：老板确认代码
  └─ 转移条件：老板批准 → Stage 5

Stage 5: 测试 (QA)
  ├─ 状态：pending → in_progress → completed
  ├─ 输出：测试用例、测试报告
  ├─ 确认节点：老板确认发布
  └─ 转移条件：老板批准 → 发布

Stage 7: OSS 调研 (OSS Scout) [并行]
  ├─ 状态：pending → in_progress → completed
  ├─ 输出：开源项目调研报告
  └─ 转移条件：自动完成，不阻塞主流程
```

### 4.2 争议仲裁流程

```
Dev 或 PM 提出争议
  ↓
创建 Dispute 记录，状态 = "open"
  ↓
第 1-3 轮讨论
  ├─ 双方轮流发言（DisputeRound 记录）
  ├─ 最多 3 轮（roundCount ≤ 3）
  └─ 每轮后检查是否达成一致
      ├─ 是 → 状态 = "resolved"，流程结束
      └─ 否 → 继续下一轮
  ↓
第 3 轮后仍未达成一致
  ↓
Architect 仲裁
  ├─ 状态 = "architect_review"
  ├─ 调用 Architect Agent，输入争议内容
  └─ 保存仲裁意见到 architectDecision
      ├─ 是 → 状态 = "resolved"，流程结束
      └─ 否 → 继续下一步
  ↓
老板决策
  ├─ 状态 = "owner_decision"
  ├─ 通知老板进行人工决策
  └─ 保存决策到 ownerDecision
      ↓
      状态 = "resolved"，流程结束
```

### 4.3 Bug 修复流程

```
QA 提交 Bug（Traceback 格式）
  ├─ 创建 Bug 记录
  ├─ 严重程度：HIGH / MEDIUM / LOW
  └─ 状态 = "open"
  ↓
Dev 收到 Bug 通知
  ↓
Dev 选择处理方式
  ├─ 方式 1：Hotfix
  │   ├─ 创建 BugReply，replyType = "hotfix"
  │   ├─ 提交修复代码
  │   └─ Bug 状态 = "in_progress"
  │
  └─ 方式 2：重构方案
      ├─ 创建 BugReply，replyType = "refactor_proposal"
      ├─ 提交方案给老板
      └─ 等待老板选择
  ↓
QA 验证修复
  ├─ 执行测试用例
  ├─ Bug 状态 = "verified" 或 "closed"
  └─ 如未修复 → 状态 = "open"，重新分配给 Dev
```

---

## 五、前端架构

### 5.1 页面结构

```
Dashboard (仪表盘)
├── WorkflowTimeline (工作流时间线)
│   ├── StageCard (阶段卡片)
│   │   ├── AgentStatus (AI 执行状态)
│   │   ├── ApprovalNode (确认节点)
│   │   └── DocumentPreview (文档预览)
│   └── ConnectionLine (阶段连接线)
│
├── DocumentCenter (文档管理中心)
│   ├── DocumentList (文档列表)
│   ├── DocumentViewer (文档查看器)
│   └── DocumentDownload (下载功能)
│
├── TaskBoard (原子化任务看板)
│   ├── TaskCard (任务卡片)
│   ├── TaskFilter (分类筛选：前端/后端/基础设施)
│   ├── DependencyGraph (依赖关系图)
│   └── TaskDetail (任务详情)
│
├── BugTracker (Bug 追踪系统)
│   ├── BugList (缺陷列表)
│   ├── BugDetail (缺陷详情)
│   ├── BugForm (Bug 提交表单)
│   └── BugReplyPanel (修复回复面板)
│
├── DisputeCenter (争议仲裁中心)
│   ├── DisputeList (争议列表)
│   ├── DisputeDetail (争议详情)
│   └── DisputeRoundPanel (仲裁轮次面板)
│
└── NotificationCenter (通知中心)
    ├── NotificationList (通知列表)
    └── NotificationDetail (通知详情)
```

### 5.2 设计风格

- **主色调**：深蓝色 (#1E3A8A) + 金色 (#F59E0B)
- **背景**：纯白 (#FFFFFF) + 浅灰 (#F9FAFB)
- **文字**：深灰 (#1F2937)
- **边框**：浅灰 (#E5E7EB)
- **成功**：绿色 (#10B981)
- **警告**：橙色 (#F59E0B)
- **错误**：红色 (#EF4444)

---

## 六、后端 API 路由

### 6.1 工作流管理

```
POST   /api/workflows              创建工作流
GET    /api/workflows/:id          获取工作流详情
GET    /api/workflows              列出所有工作流
PATCH  /api/workflows/:id/stage    推进到下一阶段
POST   /api/workflows/:id/approve  老板确认节点
```

### 6.2 文档管理

```
GET    /api/documents              列出所有文档
GET    /api/documents/:id          获取文档详情
POST   /api/documents              创建文档
PATCH  /api/documents/:id          更新文档
DELETE /api/documents/:id          删除文档
GET    /api/documents/:id/download 下载文档
```

### 6.3 任务看板

```
GET    /api/tasks                  列出所有任务
GET    /api/tasks/:id              获取任务详情
PATCH  /api/tasks/:id              更新任务状态
GET    /api/tasks/:id/dependencies 获取任务依赖
```

### 6.4 Bug 追踪

```
POST   /api/bugs                   提交 Bug
GET    /api/bugs                   列出所有 Bug
GET    /api/bugs/:id               获取 Bug 详情
PATCH  /api/bugs/:id               更新 Bug 状态
POST   /api/bugs/:id/replies       提交修复回复
GET    /api/bugs/:id/replies       获取修复回复列表
```

### 6.5 争议仲裁

```
POST   /api/disputes               创建争议
GET    /api/disputes               列出所有争议
GET    /api/disputes/:id           获取争议详情
POST   /api/disputes/:id/rounds    提交仲裁轮次
PATCH  /api/disputes/:id/architect 提交 Architect 仲裁
PATCH  /api/disputes/:id/owner     提交老板决策
```

### 6.6 通知系统

```
GET    /api/notifications          列出所有通知
PATCH  /api/notifications/:id      标记通知为已读
DELETE /api/notifications/:id      删除通知
```

---

## 七、Manus API 集成要点

### 7.1 项目创建（一次性）

系统启动时，为每个角色创建对应的 Manus Project：

```typescript
const agents = [
  { role: "CPO", persona: "..." },
  { role: "Architect", persona: "..." },
  { role: "PM", persona: "..." },
  { role: "Dev", persona: "..." },
  { role: "QA", persona: "..." },
  { role: "OSS", persona: "..." }
];

for (const agent of agents) {
  const project = await manusAPI.project.create({
    name: `${agent.role} - AI Agent`,
    instruction: agent.persona
  });
  
  // 保存到 aiAgents 表
  await db.insert(aiAgents).values({
    role: agent.role,
    manusProjectId: project.id,
    persona: agent.persona
  });
}
```

### 7.2 任务执行（循环）

每个阶段执行时：

```typescript
// 1. 创建 Stage 和 AgentTask
const stage = await db.insert(stages).values({
  workflowId,
  stageType: "requirement",
  role: "CPO",
  status: "in_progress"
});

// 2. 构建 Prompt（包含上一阶段的输出）
const prompt = buildPrompt(stageType, previousOutputs);

// 3. 调用 Manus API
const manusTask = await manusAPI.task.create({
  message: { content: [{ type: "text", text: prompt }] },
  project_id: cpoAgent.manusProjectId,
  title: `${stageType} - ${projectName}`
});

// 4. 保存 Task ID
await db.insert(agentTasks).values({
  stageId: stage.id,
  manusTaskId: manusTask.task_id,
  status: "running"
});

// 5. 启动轮询（异步后台任务）
pollManusTask(manusTask.task_id, stage.id);
```

### 7.3 结果轮询与保存

```typescript
async function pollManusTask(manusTaskId, stageId) {
  let completed = false;
  let attempts = 0;
  const maxAttempts = 120; // 2 小时（每 60 秒轮询一次）

  while (!completed && attempts < maxAttempts) {
    const messages = await manusAPI.task.listMessages({
      task_id: manusTaskId,
      order: "asc"
    });

    const statusMsg = messages.find(m => m.type === "status_update");
    
    if (statusMsg?.agent_status === "stopped") {
      // 提取最终输出
      const finalMsg = messages
        .filter(m => m.type === "assistant_message")
        .pop();

      if (finalMsg) {
        // 保存文档
        await db.insert(documents).values({
          stageId,
          docType: getDocTypeByStage(stageId),
          content: finalMsg.assistant_message.content,
          fileUrl: finalMsg.assistant_message.attachments?.[0]?.url
        });

        // 更新 Stage 状态
        await db.update(stages)
          .set({ status: "completed" })
          .where(eq(stages.id, stageId));

        // 触发老板确认节点
        await triggerApprovalNode(stageId);

        completed = true;
      }
    }

    attempts++;
    await sleep(60000); // 等待 60 秒后重试
  }

  if (!completed) {
    await db.update(stages)
      .set({ status: "failed" })
      .where(eq(stages.id, stageId));
  }
}
```

---

## 八、关键业务规则

### 8.1 硬性门控

1. **老板确认节点**：未经老板批准，不得自动流转至下一阶段
2. **Bug 严重程度**：必须为 HIGH / MEDIUM / LOW，不得更改
3. **争议仲裁链路**：必须遵循"多轮讨论 → Architect 仲裁 → 老板决策"，不得跳级
4. **Traceback 格式**：Bug 提交必须包含 Traceback 信息

### 8.2 自动化规则

1. **阶段完成通知**：阶段完成后自动通知老板
2. **任务依赖检查**：前置任务未完成时，后续任务不可开始
3. **Bug 优先级排序**：HIGH > MEDIUM > LOW
4. **争议轮次计数**：超过 3 轮自动升级至 Architect 仲裁

---

## 九、部署与扩展

### 9.1 环境变量

```
MANUS_API_KEY=<Manus API Key>
MANUS_API_URL=https://api.manus.ai
DATABASE_URL=<MySQL Connection String>
JWT_SECRET=<JWT Secret>
```

### 9.2 初始化脚本

系统首次启动时执行：

```typescript
// 1. 创建 6 个 AI Agent Projects
// 2. 初始化系统配置表
// 3. 创建默认用户（老板）
```

---

## 十、参考资源

- Manus API 文档：https://open.manus.im/docs/v2/introduction
- 用户需求文档：见 pasted_content.txt

