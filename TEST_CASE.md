# Arch-Driven SDLC - 实际使用测试案例

## 测试案例概述

本案例展示当用户在 Claude Code 中调用 `arch-driven-sdlc` skill 时，整个工作流程是如何执行的。

---

## 场景：构建用户认证系统

### 1. 用户发起请求

**用户输入：**
```
我需要为我的电商平台添加用户认证功能，包括：
- 邮箱密码登录
- JWT token 刷新
- 密码重置流程
- 记住我功能
```

### 2. Claude Code 调用 Skill

Claude Code 检测到这是一个"从需求到生产代码"的场景，自动加载 `arch-driven-sdlc` skill。

**加载的内容：**
- `SKILL.md` - 工作流程定义、规则、Agent 模板
- `agents/pm-prompt.md` - PM Agent 提示词
- `agents/arch-prompt.md` - Arch Agent 提示词
- `agents/dde-prompt.md` - DDE Agent 提示词
- `agents/qa-prompt.md` - QA Agent 提示词
- `agents/dev-prompt.md` - Dev Agent 提示词
- `agents/ops-prompt.md` - Ops Agent 提示词
- `isolation.ts` - 隔离规则
- `aspects/aop.ts` - AOP 拦截器
- `workflow.ts` - 状态机协调

### 3. 用户提供配置信息

Claude Code 检查 SKILL.md 中的"Configuration Requirements"部分，发现需要以下配置。

**用户需要回答的问题（如果需要）：**

```
Q: 是否使用特定的 LLM 提供商？
A: [OpenAI / Anthropic / Ollama]
   默认：OpenAI（如未指定）

Q: 是否有需要保护回归测试的现有模块？
A: [src/user/ / src/order/ / src/payment/]
   默认：无（如果未指定）
```

**在本测试案例中，用户回答：**
```
LLM 提供商: OpenAI
回归模块: src/user/
```

**这些配置信息的作用：**

| 配置 | 用途 | 在本案例中的值 |
|--------|------|-----------------|
| `llm.provider` | 选择 LLM 提供商 | "openai" |
| `llm.models.PM` | PM Agent 使用的模型 | "sonnet" |
| `llm.models.Arch` | Arch Agent 使用的模型 | "opus" |
| `llm.models.DDE` | DDE Agent 使用的模型 | "sonnet" |
| `llm.models.QA` | QA Agent 使用的模型 | "sonnet" |
| `llm.models.Dev` | Dev Agent 使用的模型 | "haiku" |
| `llm.models.Ops` | Ops Agent 使用的模型 | "sonnet" |
| `testing.regressionPaths` | 需要保护的回归测试路径 | ["tests/regression/**/*.test.ts"] |

**注意：** 大多数情况下，用户不需要提供这些配置。Claude Code 会使用默认值直接执行。

---

## 4. 工作流执行 - 逐步详解

### Step 1: DISCOVERY 阶段 - PM Agent

**发生什么：**
1. Claude Code 读取 `SKILL.md` 中的工作流定义
2. Claude Code 使用 Agent 工具，传入 `pm-prompt.md` 的内容和用户 PRD
3. Agent 工具调用 OpenAI GPT-4 (sonnet) 模型
4. LLM 返回 PM Agent 的分析结果

**传给 LLM 的输入（Agent 工具自动准备）：**
```
用户 PRD:
"我需要为我的电商平台添加用户认证功能，包括：
- 邮箱密码登录
- JWT token 刷新
- 密码重置流程
- 记住我功能"

配置上下文:
{
  "state": "DISCOVERY",
  "artifacts": {},
  "previousOutputs": {}
}

PM Agent Prompt Template (从 agents/pm-prompt.md):
# PM Agent - Requirements Analysis
## Role
You are Product Manager Agent. Your responsibility is to analyze requirements...

## Your Tasks
1. Requirements Refinement
2. Boundary Context Definition

## Context
{{CONTEXT}}

## Input PRD
{{INPUT}}
```

**LLM 返回输出：**
```markdown
# PRD Document

## Overview
User Authentication System

## Requirements
### Functional Requirements
- [FR-001] User can register with email and password
- [FR-002] User can login with email and password
- [FR-003] User can request password reset
- [FR-004] Session is managed via JWT tokens
- [FR-005] User can enable "remember me" functionality

### Non-Functional Requirements
- [NFR-001] Passwords must be hashed using bcrypt
- [NFR-002] JWT tokens expire after 24 hours
- [NFR-003] Rate limiting on login attempts (5 per minute)
- [NFR-004] Password reset link expires after 1 hour
```

**Claude Code 的操作：**
1. 接收 LLM 返回的 PRD
2. 验证 PRD 是否包含所有功能需求
3. 调用 `isolation.ts` 检查 PRD 中是否违反隔离规则
4. 调用 `workflow.ts` 的 `storeArtifact()` 方法，保存 PRD
5. 记录：`[DISCOVERY] PM Agent completed`

---

### Step 2: DISCOVERY 阶段 - Arch Agent

**发生什么：**
1. Claude Code 使用 Agent 工具，传入 `arch-prompt.md` 的内容
2. Agent 工具调用 OpenAI GPT-4 (opus) 模型（Arch Agent 需要更强大的模型）
3. LLM 返回架构设计结果

**传给 LLM 的输入：**
```
PM Agent 的输出:
# PRD Document
...（完整 PRD 内容）...

配置上下文:
{
  "state": "DISCOVERY",
  "artifacts": {
    "DISCOVERY_PM": "# PRD Document..."
  },
  "previousOutputs": {}
}

Arch Agent Prompt Template:
# Architect Agent - Architecture Design
## Role
You are Software Architect Agent. Your responsibility is to design architecture...

## Context
{{CONTEXT}}

## PRD (from PM)
{{INPUT}}
```

**LLM 返回输出：**
```markdown
# Architecture Document

## Overview
Hexagonal Architecture for User Authentication

## Architectural Pattern
**Pattern:** Hexagonal Architecture (Ports and Adapters)

**Rationale:**
- Clean separation of concerns
- Easy to test
- Dependency injection for flexibility

## Module Structure
src/features/user-auth/
  domain/
    entities/User.ts
    value-objects/UserId.ts
    use-cases/RegisterUser.ts
    use-cases/LoginUser.ts
    use-cases/ResetPassword.ts
  ports/primary/
    AuthControllerPort.ts
  ports/secondary/
    UserRepositoryPort.ts
    EmailSenderPort.ts
  adapters/primary/
    AuthController.ts
  adapters/secondary/
    UserRepository.ts
    EmailSenderAdapter.ts

## Impact Analysis
- No existing modules affected
- New feature is isolated
- No coupling detected

## Dependency Guard Report
- Scanned files: 50
- No coupling violations detected
- Isolation Sandbox compliance: ✅
```

**Claude Code 的操作：**
1. 接收 LLM 返回的架构文档
2. 验证架构是否符合隔离规则（通过 `isolation.ts`）
3. 调用 `workflow.ts` 的 Dependency Guard（`aspects/aop.ts`）
4. Dependency Guard 检查架构中是否有耦合问题（模拟返回 true/false）
5. 保存架构文档
6. 记录：`[DISCOVERY] Arch Agent completed`

---

### Step 3: CONTRACT 阶段 - DDE Agent

**发生什么：**
1. Claude Code 使用 Agent 工具，传入 `dde-prompt.md` 的内容
2. Agent 工具调用 OpenAI GPT-4 (sonnet) 模型
3. LLM 返回 Schema 和 API 契约

**LLM 返回输出：**
```markdown
# DDE Document

## Database Schema

### New Tables
#### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| refresh_token | VARCHAR(500) | NULL | JWT refresh token |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

### Migration File
migrations/20260426_add_users.sql

```sql
CREATE TABLE `users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `refresh_token` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Domain Types

### Entities
```typescript
export interface User {
  id: number;
  email: string;
  passwordHash: string;
  refreshToken?: string;
  createdAt: Date;
}
```

### Port Interfaces
```typescript
export interface UserRepositoryPort {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByRefreshToken(token: string): Promise<User | null>;
}

export interface EmailSenderPort {
  sendPasswordReset(email: string, token: string): Promise<void>;
}
```
```

**Claude Code 的操作：**
1. 接收 Schema 和 API 契约
2. 验证是否符合隔离规则
3. 保存 Schema 和 API 文档
4. 记录：`[CONTRACT] DDE Agent completed`

---

### Step 4: TDD_RED 阶段 - QA Agent

**发生什么：**
1. Claude Code 使用 Agent 工具，传入 `qa-prompt.md` 的内容
2. Agent 工具调用 OpenAI GPT-4 (sonnet) 模型
3. LLM 返回测试套件

**传给 LLM 的输入（包含之前所有 artifact）：**
```
配置上下文:
{
  "state": "TDD_RED",
  "artifacts": {
    "DISCOVERY_PM": "# PRD Document...",
    "DISCOVERY_Arch": "# Architecture Document...",
    "CONTRACT_DDE": "# DDE Document..."
  },
  "previousOutputs": {}
}

QA Agent Prompt Template:
# QA Agent - Quality Assurance
## Role
You are Quality Assurance Agent. Your responsibility is to write TDD_RED tests...

## Context
{{CONTEXT}}

## DDE Document (from DDE)
{{INPUT}}

## Your Tasks
1. Write failing tests for new feature
2. Write regression tests for B modules
```

**LLM 返回输出：**
```markdown
# QA Document

## Test Suite Overview
- Feature Tests: tests/user-auth.test.ts
- Regression Tests: tests/regression/user.test.ts

## TDD_RED Tests

### Happy Path Tests
```typescript
describe('RegisterUser', () => {
  it('should register a new user', async () => {
    // Arrange
    const input = { email: 'test@example.com', password: 'Password123!' };

    // Act
    const result = await registerUser.execute(input);

    // Assert
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });
});
```

### Edge Case Tests
```typescript
it('should throw validation error for invalid email', async () => {
  const input = { email: 'invalid', password: 'Password123!' };
  
  await expect(registerUser.execute(input)).rejects.toThrow('Invalid email');
});
```

## Expected Test Status

| Test File | Expected Status |
|-----------|-----------------|
| tests/user-auth.test.ts | FAILING (before implementation) |
| tests/regression/user.test.ts | PASSING (baseline) |
```

**Claude Code 的操作：**
1. 接收测试套件代码
2. 验证是否符合隔离规则
3. 保存测试文档
4. 记录：`[TDD_RED] QA Agent completed`

**重要：** LLM 返回的测试代码是故意包含错误的（TDD_RED），用于确保开发阶段的测试驱动。

---

### Step 5: IMPLEMENT 阶段 - Dev Agent

**发生什么：**
1. Claude Code 使用 Agent 工具，传入 `dev-prompt.md` 的内容
2. **在此之前，AOP 的 Dependency Guard 会执行：**
   - 检查 Dev Agent 的输出是否违反隔离规则
   - 模拟 AST 扫描返回 true/false
3. Agent 工具调用 OpenAI GPT-4 (haiku) 模型（Dev 可以用较快的模型）
4. LLM 返回实现代码

**传给 LLM 的输入：**
```
配置上下文:
{
  "state": "IMPLEMENT",
  "artifacts": {
    "DISCOVERY_PM": "...",
    "DISCOVERY_Arch": "...",
    "CONTRACT_DDE": "...",
    "TDD_RED_QA": "..."
  },
  "previousOutputs": {}
}

Dev Agent Prompt Template:
# Dev Agent - Development
## Role
You are Development Agent. Your responsibility is to implement code in Sandbox...

## Context
{{CONTEXT}}

## QA Document (from QA)
{{INPUT}}

## Your Tasks
1. Implement until tests turn GREEN
2. Add structured logging
```

**AOP - Dependency Guard 检查（实现前）：**
```
[DependencyGuard] Scanning for coupling...
扫描结果: 无耦合（通过）
```

**LLM 返回输出：**
```markdown
# Dev Implementation

## Implementation

### Domain Layer
```typescript
export class RegisterUser {
  constructor(
    private readonly repository: UserRepositoryPort
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    logger.info('RegisterUser started', { email: input.email });

    try {
      // Validate
      if (!this.isValidEmail(input.email)) {
        logger.warn('Validation failed', { email: input.email });
        throw new ValidationError('Invalid email');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create entity
      const user: User = {
        id: 0,
        email: input.email,
        passwordHash,
        createdAt: new Date(),
      };

      // Persist
      const savedUser = await this.repository.save(user);

      logger.info('RegisterUser completed', { id: savedUser.id });

      return { user: savedUser };
    } catch (error) {
      logger.error('RegisterUser failed', { error, input });
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### No-Silent-Failure 检查（实现后）：**
```
[NoSilentFailure] Checking for structured logging...
检查结果: ✅ 通过（所有错误都有 logger.error）
```

**Claude Code 的操作：**
1. 接收实现代码
2. Anti-Regression AOP 会运行（执行中）：
   - 运行回归测试：`npm test -- tests/regression/**/*.test.ts`
   - 如果失败，触发回滚
3. 验证是否符合隔离规则
4. No-Silent-Failure AOP 检查日志
5. 保存实现代码
6. 记录：`[IMPLEMENT] Dev Agent completed`

---

### Step 6: INTEGRATION 阶段 - Arch Agent（第二次）

**发生什么：**
1. Claude Code 使用 Agent 工具，传入 `arch-prompt.md` 的内容
2. Agent 工具调用 OpenAI GPT-4 (opus) 模型
3. LLM 返回集成方案

**Claude Code 的操作：**
1. 接收集成方案
2. 验证是否符合隔离规则
3. 保存集成文档
4. 记录：`[INTEGRATION] Arch Agent completed`

---

### Step 7: COMMIT 阶段 - Ops Agent

**发生什么：**
1. Claude Code 使用 Agent 工具，传入 `ops-prompt.md` 的内容
2. Agent 工具调用 OpenAI GPT-4 (sonnet) 模型
3. LLM 返回 CI/CD 配置

**LLM 返回输出：**
```markdown
# Ops Document

## CI/CD Pipeline

### Continuous Integration
```yaml
name: CI

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
```

### Deployment
```yaml
deploy-production:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to production
      run: kubectl apply -f k8s/
```
```

**Claude Code 的操作：**
1. 接收 CI/CD 配置
2. 保存 Ops 文档
3. 记录：`[COMMIT] Ops Agent completed`

---

## 最终输出

所有阶段完成后，Claude Code 生成以下输出目录结构：

```
output/
├── docs/
│   ├── PRD.md                          # PM Agent 输出
│   ├── ARCHITECTURE.md                 # Arch Agent 输出
│   ├── DDE.md                          # DDE Agent 输出
│   ├── QA.md                           # QA Agent 输出
│   ├── DEV.md                          # Dev Agent 输出
│   └── OPS.md                          # Ops Agent 输出
├── src/features/user-auth/
│   ├── domain/
│   │   ├── entities/User.ts
│   │   ├── value-objects/UserId.ts
│   │   └── use-cases/RegisterUser.ts
│   ├── ports/primary/AuthControllerPort.ts
│   ├── ports/secondary/UserRepositoryPort.ts
│   └── adapters/secondary/UserRepository.ts
├── tests/user-auth.test.ts              # 测试代码
└── migrations/20260426_add_users.sql  # 数据库迁移
```

---

## 配置信息总结

| 配置项 | 默认值 | 作用 | 用户何时需要提供 |
|---------|---------|------|-----------------|
| `llm.provider` | "openai" | LLM 提供商选择 | 需要时 |
| `llm.apiKey` | 环境变量或 Claude Code 配置 | API 密钥 | 通常不需要（Claude Code 内置） |
| `llm.models.*` | 预定义映射 | 各 Agent 使用的模型 | 需要时 |
| `testing.regressionPaths` | 空 | 回归测试路径 | 有现有模块时 |
| `output.directory` | "./output" | 输出目录 | 需要时 |

---

## 执行时间线

```
0s: 用户发起请求
    ↓
5s: Claude Code 调用 arch-driven-sdlc skill
    ↓
10s: DISCOVERY - PM Agent 执行（30s）
    ↓
40s: DISCOVERY - Arch Agent 执行（30s）
    ↓
70s: CONTRACT - DDE Agent 执行（30s）
    ↓
100s: TDD_RED - QA Agent 执行（30s）
    ↓
130s: IMPLEMENT - Dev Agent 执行（60s）
    ↓
190s: INTEGRATION - Arch Agent 执行（60s）
    ↓
250s: COMMIT - Ops Agent 执行（60s）
    ↓
260s: 所有输出文件生成完成
```

---

## 关键点总结

1. **用户只需要提供 PRD/需求**
   - 其他配置都是可选的，有合理的默认值

2. **所有 LLM 调用由 Agent 工具自动处理**
   - skill 定义 Agent 模板
   - Agent 工具负责调用 LLM
   - skill 不需要实现 LLM 客户端

3. **AOP 拦截在每步自动执行**
   - Dependency Guard 在 IMPLEMENT 前执行
   - Anti-Regression 在 IMPLEMENT 期间执行
   - No-Silent-Failure 在每步后执行

4. **状态机由 workflow.ts 协调**
   - 确保按正确顺序执行各阶段
   - 处理失败和重试

5. **隔离规则由 isolation.ts 验证**
   - Backend: 检查是否在 src/features/ 下
   - Frontend: 检查是否使用 .v2.tsx
   - Database: 检查迁移 SQL 是否只包含 ADD

---

## 测试这个案例

要测试这个 skill：

```markdown
我需要为我的电商平台添加用户认证功能，包括：
- 邮箱密码登录
- JWT token 刷新
- 密码重置流程
```

预期结果：
1. Claude Code 自动调用 arch-driven-sdlc skill
2. 执行 7 个工作流阶段
3. 生成完整的 PRD、架构、Schema、测试、代码、CI/CD 配置
4. 所有输出保存在 output/ 目录
```
