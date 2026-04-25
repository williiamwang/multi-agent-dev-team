import { callOpenAI, LLMMessage } from "../llm/openai";
import { getDb } from "../db";
import { agentMessages, agentTasks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type AgentRole = "CPO" | "Architect" | "PM" | "Dev" | "QA" | "OSS Scout";

export interface AgentTask {
  id: number;
  role: AgentRole;
  prompt: string;
  context?: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AgentExecutionResult {
  taskId: number;
  success: boolean;
  result: string;
  tokensUsed: number;
  executionTime: number;
}

/**
 * Get system prompt for agent role
 */
export function getSystemPrompt(role: AgentRole): string {
  const prompts: Record<AgentRole, string> = {
    CPO: `你是一个产品负责人（Chief Product Officer）。你的职责是：
- 理解用户需求和市场机会
- 制定产品战略和路线图
- 编写清晰的产品需求文档（PRD）
- 优先级排序和决策
请以专业、清晰的方式提供建议。`,

    Architect: `你是一个系统架构师（System Architect）。你的职责是：
- 设计系统架构和技术方案
- 评估技术可行性
- 制定技术规范和标准
- 解决技术争议和冲突
请提供详细的架构设计和技术建议。`,

    PM: `你是一个项目经理（Project Manager）。你的职责是：
- 将需求分解为具体任务
- 制定项目计划和时间表
- 协调团队合作
- 追踪项目进度
请提供清晰的任务分解和项目计划。`,

    Dev: `你是一个开发工程师（Developer）。你的职责是：
- 实现功能和需求
- 编写高质量代码
- 进行代码审查
- 修复缺陷和问题
请提供技术实现方案和代码建议。`,

    QA: `你是一个质量保证工程师（QA Engineer）。你的职责是：
- 设计测试用例
- 执行功能测试
- 发现和报告缺陷
- 验证修复质量
请提供详细的测试报告和缺陷分析。`,

    "OSS Scout": `你是一个开源技术调研员（OSS Scout）。你的职责是：
- 调研开源项目和技术方案
- 评估开源库的质量和适用性
- 提供技术推荐和对比分析
- 提供集成建议
请提供详细的开源项目调研报告。`,
  };

  return prompts[role];
}

/**
 * Execute agent task
 */
export async function executeAgentTask(
  taskId: number,
  role: AgentRole,
  prompt: string,
  context?: Record<string, unknown>
): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    // Update task status to running
    const db = await getDb();
    if (db) {
      await db
        .update(agentTasks)
        .set({ status: "running" })
        .where(eq(agentTasks.id, taskId));
    }

    // Build messages
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: getSystemPrompt(role),
      },
      {
        role: "user",
        content: buildPromptWithContext(prompt, context),
      },
    ];

    // Call LLM
    const response = await callOpenAI(messages, {
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 4000,
    });

    const executionTime = Date.now() - startTime;

    // Save result
    if (db) {
      await db
        .update(agentTasks)
        .set({
          status: "completed",
          result: response.content,
        })
        .where(eq(agentTasks.id, taskId));

      // Save message
      await db.insert(agentMessages).values({
        agentTaskId: taskId,
        role: "assistant",
        content: response.content,
      });
    }

    return {
      taskId,
      success: true,
      result: response.content,
      tokensUsed: response.tokens.total,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update task status to failed
    const db = await getDb();
    if (db) {
      await db
        .update(agentTasks)
        .set({
          status: "failed",
          result: `Error: ${errorMessage}`,
        })
        .where(eq(agentTasks.id, taskId));
    }

    return {
      taskId,
      success: false,
      result: errorMessage,
      tokensUsed: 0,
      executionTime,
    };
  }
}

/**
 * Build prompt with context
 */
function buildPromptWithContext(prompt: string, context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) {
    return prompt;
  }

  const contextStr = Object.entries(context)
    .map(([key, value]) => {
      if (typeof value === "object") {
        return `${key}:\n${JSON.stringify(value, null, 2)}`;
      }
      return `${key}: ${value}`;
    })
    .join("\n\n");

  return `${prompt}\n\n--- 上下文信息 ---\n${contextStr}`;
}

/**
 * Get agent task history
 */
export async function getAgentTaskHistory(taskId: number): Promise<LLMMessage[]> {
  const db = await getDb();
  if (!db) return [];

  const messages = await db
    .select()
    .from(agentMessages)
    .where(eq(agentMessages.agentTaskId, taskId))
    .orderBy((t) => t.createdAt);

  return messages.map((msg) => ({
    role: msg.role as "system" | "user" | "assistant",
    content: msg.content,
  }));
}

/**
 * Continue agent conversation
 */
export async function continueAgentConversation(
  taskId: number,
  role: AgentRole,
  userMessage: string
): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get task
    const task = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.id, taskId))
      .limit(1);

    if (!task[0]) throw new Error("Task not found");

    // Get conversation history
    const history = await getAgentTaskHistory(taskId);

    // Build new messages
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: getSystemPrompt(role),
      },
      ...history,
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Call LLM
    const response = await callOpenAI(messages, {
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 4000,
    });

    const executionTime = Date.now() - startTime;

    // Save messages
    await db.insert(agentMessages).values([
      {
        agentTaskId: taskId,
        role: "user",
        content: userMessage,
      },
      {
        agentTaskId: taskId,
        role: "assistant",
        content: response.content,
      },
    ]);

    return {
      taskId,
      success: true,
      result: response.content,
      tokensUsed: response.tokens.total,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      taskId,
      success: false,
      result: errorMessage,
      tokensUsed: 0,
      executionTime,
    };
  }
}
