/**
 * Workflow Engine
 * Manages project stages, AI task execution, and approval nodes
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  workflows,
  stages,
  agentTasks,
  approvalNodes,
  documents,
  notifications,
  aiAgents,
} from "../drizzle/schema";
import { getManusClient } from "./manus";
import { getAgentDefinition } from "./agents";

export type StageType =
  | "requirement"
  | "architecture"
  | "decomposition"
  | "development"
  | "testing"
  | "bugfix"
  | "release";

export type StageRole = "CPO" | "Architect" | "PM" | "Dev" | "QA" | "OSS";

const STAGE_SEQUENCE: StageType[] = [
  "requirement",
  "architecture",
  "decomposition",
  "development",
  "testing",
  "bugfix",
  "release",
];

const STAGE_ROLES: Record<StageType, StageRole> = {
  requirement: "CPO",
  architecture: "Architect",
  decomposition: "PM",
  development: "Dev",
  testing: "QA",
  bugfix: "Dev",
  release: "Dev",
};

/**
 * Create a new workflow for a project
 */
export async function createWorkflow(projectId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(workflows).values({
    projectId,
    currentStage: "requirement",
    status: "pending",
  });

  const workflowId = result[0]?.insertId;
  if (!workflowId) {
    throw new Error("Failed to create workflow");
  }

  // Create approval nodes for all 5 confirmation points
  const approvalNodeTypes: Array<{
    nodeType: string;
    stageType: StageType;
  }> = [
    { nodeType: "requirement", stageType: "requirement" },
    { nodeType: "architecture", stageType: "architecture" },
    { nodeType: "decomposition", stageType: "decomposition" },
    { nodeType: "development", stageType: "development" },
    { nodeType: "testing", stageType: "testing" },
  ];

  for (const { nodeType, stageType } of approvalNodeTypes) {
    // Create stage first
    const stageResult = await db.insert(stages).values({
      workflowId,
      stageType,
      role: STAGE_ROLES[stageType],
      status: "pending",
    });

    const stageId = stageResult[0]?.insertId;

    // Create approval node
    if (stageId) {
      await db.insert(approvalNodes).values({
        workflowId,
        nodeType: nodeType as any,
        stageId,
        status: "pending",
      });
    }
  }

  return workflowId;
}

/**
 * Start a stage and create AI task
 */
export async function startStage(
  workflowId: number,
  stageType: StageType,
  previousStageDocs?: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const manus = getManusClient();

  // Get stage
  const stageRecords = await db
    .select()
    .from(stages)
    .where(and(eq(stages.workflowId, workflowId), eq(stages.stageType, stageType)));

  if (stageRecords.length === 0) {
    throw new Error(`Stage not found: ${stageType}`);
  }

  const stage = stageRecords[0];
  const role = STAGE_ROLES[stageType];
  const agentDef = getAgentDefinition(role as StageRole);

  // Get AI agent
  const agents = await db
    .select()
    .from(aiAgents)
    .where(eq(aiAgents.role, role as any));

  if (agents.length === 0) {
    throw new Error(`AI agent not found for role: ${role}`);
  }

  const agent = agents[0];

  // Build prompt
  const prompt = buildPrompt(stageType, previousStageDocs);

  // Create Manus task
  const manusTask = await manus.createTask({
    message: {
      content: [
        {
          type: "text",
          text: prompt,
        },
      ],
    },
    project_id: agent.manusProjectId,
    title: `${stageType} - Workflow ${workflowId}`,
  });

  // Create agent task record
  const agentTaskResult = await db.insert(agentTasks).values({
    stageId: stage.id,
    agentId: agent.id,
    manusTaskId: manusTask.task_id,
    prompt,
    status: "running",
  });

  // Update stage status
  await db
    .update(stages)
    .set({
      status: "in_progress",
      startedAt: new Date(),
    })
    .where(eq(stages.id, stage.id));

  // Update workflow status
  await db
    .update(workflows)
    .set({
      status: "in_progress",
      currentStage: stageType,
    })
    .where(eq(workflows.id, workflowId));

  return {
    agentTaskId: agentTaskResult[0]?.insertId,
    manusTaskId: manusTask.task_id,
    stageId: stage.id,
  };
}

/**
 * Poll and save AI task results
 */
export async function pollAndSaveTaskResult(
  manusTaskId: string,
  agentTaskId: number,
  stageId: number,
  workflowId: number
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const manus = getManusClient();

  try {
    // Poll for messages
    const messages = await manus.listMessages({
      task_id: manusTaskId,
      order: "asc",
    });

    // Check if task is completed
    const statusMsg = messages.find((m: any) => m.type === "status_update");
    if (!statusMsg || statusMsg.agent_status !== "stopped") {
      return { completed: false };
    }

    // Extract final output
    const finalMsg = messages
      .filter((m: any) => m.type === "assistant_message")
      .pop();

    if (!finalMsg) {
      throw new Error("No assistant message found");
    }

    const content = finalMsg.assistant_message.content;
    const fileUrl = finalMsg.assistant_message.attachments?.[0]?.url;

    // Get stage info
    const stageRecords = await db
      .select()
      .from(stages)
      .where(eq(stages.id, stageId));

    if (stageRecords.length === 0) {
      throw new Error("Stage not found");
    }

    const stage = stageRecords[0];

    // Save document
    const docTypeMap: Record<StageType, string> = {
      requirement: "PRD",
      architecture: "Architecture",
      decomposition: "TaskList",
      development: "SelfTestReport",
      testing: "TestReport",
      bugfix: "SelfTestReport",
      release: "SelfTestReport",
    };

    await db.insert(documents).values({
      workflowId,
      stageId,
      docType: docTypeMap[stage.stageType as StageType] as any,
      title: `${stage.stageType} Output`,
      content,
      fileUrl,
    });

    // Update agent task
    await db
      .update(agentTasks)
      .set({
        status: "completed",
        result: content,
      })
      .where(eq(agentTasks.id, agentTaskId));

    // Update stage
    await db
      .update(stages)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(stages.id, stageId));

    // Create approval node notification
    const approvalRecords = await db
      .select()
      .from(approvalNodes)
      .where(eq(approvalNodes.stageId, stageId));

    if (approvalRecords.length > 0) {
      const approval = approvalRecords[0];
      // Notification will be created when approval is needed
    }

    return { completed: true, content };
  } catch (error) {
    console.error("[Workflow] Failed to poll task result:", error);

    // Update stage status to failed
    await db
      .update(stages)
      .set({ status: "failed" })
      .where(eq(stages.id, stageId));

    throw error;
  }
}

/**
 * Approve a stage and move to next
 */
export async function approveStage(
  workflowId: number,
  stageType: StageType,
  approvedBy: number,
  approvalComment?: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Update approval node
  const approvalRecords = await db
    .select()
    .from(approvalNodes)
    .where(and(eq(approvalNodes.workflowId, workflowId), eq(approvalNodes.nodeType, stageType as any)));

  if (approvalRecords.length === 0) {
    throw new Error("Approval node not found");
  }

  const approval = approvalRecords[0];

  await db
    .update(approvalNodes)
    .set({
      status: "approved",
      approvedBy,
      approvalComment,
      approvedAt: new Date(),
    })
    .where(eq(approvalNodes.id, approval.id));

  // Move to next stage
  const currentIndex = STAGE_SEQUENCE.indexOf(stageType);
  if (currentIndex < STAGE_SEQUENCE.length - 1) {
    const nextStage = STAGE_SEQUENCE[currentIndex + 1];

    // Start next stage
    const stageRecords = await db
      .select()
      .from(stages)
      .where(and(eq(stages.workflowId, workflowId), eq(stages.stageType, stageType)));

    const previousContent =
      stageRecords.length > 0 ? stageRecords[0].id : undefined;

    await startStage(workflowId, nextStage);
  } else {
    // Workflow completed
    await db
      .update(workflows)
      .set({
        status: "completed",
      })
      .where(eq(workflows.id, workflowId));
  }
}

/**
 * Build prompt for AI agent based on stage type and previous outputs
 */
function buildPrompt(stageType: StageType, previousDocs?: string): string {
  const basePrompts: Record<StageType, string> = {
    requirement:
      "Based on the user requirements and business context, please generate a comprehensive PRD document.",
    architecture:
      "Based on the PRD document provided, please design the complete technical architecture.",
    decomposition:
      "Based on the PRD and architecture documents, please decompose the requirements into atomic tasks.",
    development:
      "Based on the task card and API contract, please implement the feature code.",
    testing:
      "Based on the PRD and API contract, please create comprehensive test cases.",
    bugfix: "Based on the bug report, please provide a fix or refactor proposal.",
    release: "Based on all completed stages, please prepare the release notes.",
  };

  let prompt = basePrompts[stageType];

  if (previousDocs) {
    prompt += `\n\nPrevious stage outputs:\n${previousDocs}`;
  }

  return prompt;
}

/**
 * Get workflow status
 */
export async function getWorkflowStatus(workflowId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const workflowRecords = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId));

  if (workflowRecords.length === 0) {
    throw new Error("Workflow not found");
  }

  const workflow = workflowRecords[0];

  // Get all stages
  const stageRecords = await db
    .select()
    .from(stages)
    .where(eq(stages.workflowId, workflowId));

  // Get all documents
  const docRecords = await db
    .select()
    .from(documents)
    .where(eq(documents.workflowId, workflowId));

  // Get all approval nodes
  const approvalRecords = await db
    .select()
    .from(approvalNodes)
    .where(eq(approvalNodes.workflowId, workflowId));

  return {
    workflow,
    stages: stageRecords,
    documents: docRecords,
    approvals: approvalRecords,
  };
}
