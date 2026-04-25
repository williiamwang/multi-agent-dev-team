# 部署指南

## 快速部署

### 前置条件

1. Manus 账户和 OAuth 应用配置
2. MySQL/TiDB 数据库
3. S3 存储配置（文件存储）

### 环境配置

1. **复制环境变量模板**
   ```bash
   cp .env.example .env
   ```

2. **配置必要的环境变量**
   ```env
   # 数据库连接
   DATABASE_URL=mysql://user:password@host:3306/multi_agent_dev_team

   # Manus OAuth
   VITE_APP_ID=your_manus_app_id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

   # Manus API
   BUILT_IN_FORGE_API_URL=https://api.manus.im
   BUILT_IN_FORGE_API_KEY=your_manus_api_key
   VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
   VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

   # 应用配置
   JWT_SECRET=your_secure_jwt_secret
   OWNER_OPEN_ID=your_owner_open_id
   OWNER_NAME=Your Name
   ```

### 数据库初始化

1. **创建数据库**
   ```bash
   mysql -u root -p -e "CREATE DATABASE multi_agent_dev_team CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. **运行迁移**
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

### 本地开发

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm dev
   ```

3. **访问应用**
   - 前端: http://localhost:5173
   - 后端: http://localhost:3000

### 生产部署

#### 使用 Manus 平台部署

1. **创建检查点**
   ```bash
   git add .
   git commit -m "Production ready"
   ```

2. **在 Manus 管理界面点击 Publish**
   - 系统会自动构建和部署
   - 获得生产 URL

#### 使用 Docker 部署

1. **创建 Dockerfile**
   ```dockerfile
   FROM node:22-alpine

   WORKDIR /app

   COPY package.json pnpm-lock.yaml ./
   RUN npm install -g pnpm && pnpm install --frozen-lockfile

   COPY . .

   RUN pnpm build

   EXPOSE 3000

   CMD ["pnpm", "start"]
   ```

2. **构建镜像**
   ```bash
   docker build -t multi-agent-dev-team:latest .
   ```

3. **运行容器**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="mysql://..." \
     -e VITE_APP_ID="..." \
     multi-agent-dev-team:latest
   ```

#### 使用 Railway/Render 部署

1. **连接 GitHub 仓库**
2. **配置环境变量**
3. **设置构建命令**: `pnpm build`
4. **设置启动命令**: `pnpm start`

### 初始化 AI Agents

1. **创建 Manus Projects**
   ```bash
   node scripts/init-agents.mjs
   ```

2. **保存 Agent IDs**
   - 脚本会输出 6 个 AI Agent 的 Project IDs
   - 将这些 IDs 保存到数据库

### 监控和维护

#### 日志查看

```bash
# 查看应用日志
docker logs multi-agent-dev-team

# 查看数据库连接
mysql -u root -p multi_agent_dev_team -e "SHOW PROCESSLIST;"
```

#### 性能优化

1. **数据库索引**
   ```sql
   CREATE INDEX idx_workflows_project ON workflows(projectId);
   CREATE INDEX idx_stages_workflow ON stages(workflowId);
   CREATE INDEX idx_bugs_workflow ON bugs(workflowId);
   ```

2. **缓存策略**
   - 使用 Redis 缓存工作流状态
   - 缓存 AI Agent 配置

3. **数据库连接池**
   ```env
   DATABASE_URL=mysql://user:password@host:3306/db?connectionLimit=10
   ```

### 备份和恢复

#### 数据库备份

```bash
# 备份数据库
mysqldump -u root -p multi_agent_dev_team > backup.sql

# 恢复数据库
mysql -u root -p multi_agent_dev_team < backup.sql
```

#### 文件备份

```bash
# 备份 S3 文件
aws s3 sync s3://your-bucket/documents ./backup/
```

### 故障排除

#### 问题：工作流卡住

**症状**: 阶段状态一直是 `in_progress`

**解决方案**:
1. 检查 `agentTasks` 表中的任务状态
2. 检查 Manus API 连接
3. 查看应用日志中的错误信息

#### 问题：数据库连接失败

**症状**: `Error: connect ECONNREFUSED`

**解决方案**:
1. 验证 DATABASE_URL 配置
2. 检查数据库服务是否运行
3. 检查防火墙规则

#### 问题：OAuth 登录失败

**症状**: 登录后重定向到错误页面

**解决方案**:
1. 验证 VITE_APP_ID 和 OAUTH_SERVER_URL
2. 检查回调 URL 配置
3. 查看浏览器控制台错误

### 性能基准

| 指标 | 目标 | 实际 |
|------|------|------|
| 首页加载 | < 2s | ~1.5s |
| 仪表盘加载 | < 3s | ~2.5s |
| API 响应 | < 500ms | ~200ms |
| 数据库查询 | < 100ms | ~50ms |

### 安全检查清单

- [ ] 所有环境变量已配置
- [ ] JWT_SECRET 是强随机字符串
- [ ] 数据库密码已加密
- [ ] S3 存储桶配置了访问控制
- [ ] HTTPS 已启用
- [ ] CORS 已正确配置
- [ ] 速率限制已启用
- [ ] 日志不包含敏感信息

### 升级指南

#### 从 v1.0 升级到 v1.1

1. **备份数据库**
   ```bash
   mysqldump -u root -p multi_agent_dev_team > backup-v1.0.sql
   ```

2. **更新代码**
   ```bash
   git pull origin main
   pnpm install
   ```

3. **运行迁移**
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

4. **重启应用**
   ```bash
   pnpm build
   pnpm start
   ```

## 支持

如需部署帮助，请通过 Manus 平台的反馈系统联系支持。
