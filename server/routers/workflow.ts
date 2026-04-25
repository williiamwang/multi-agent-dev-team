/**
 * Workflow Management Router
 * tRPC procedures for workflow operations
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  workflows,
  projects,
  stages,
  approvalNodes,
  documents,
  atomicTasks,
  bugs,
  disputes,
  notifications,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  createWorkflow,
  startStage,
  approveStage,
  getWorkflowStatus,
} from "../workflow";

export const workflowRouter = router({
  /**
   * Create a new workflow for a project
   */
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        projectName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project ownership
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId));

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      if (project[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Create workflow
      const workflowId = await createWorkflow(input.projectId);

      return {
        workflowId,
        status: "created",
      };
    }),

  /**
   * Get workflow details
   */
  getById: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const status = await getWorkflowStatus(input.workflowId);

      return {
        workflow: status.workflow,
        stages: status.stages,
        documents: status.documents,
        approvals: status.approvals,
      };
    }),

  /**
   * List all workflows for a project
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(workflows)
        .where(eq(workflows.projectId, input.projectId));

      return result;
    }),

  /**
   * Approve a stage and move to next
   */
  approveStage: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        stageType: z.enum([
          "requirement",
          "architecture",
          "decomposition",
          "development",
          "testing",
        ]),
        approvalComment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is owner
      const workflow = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, input.workflowId));

      if (workflow.length === 0) {
        throw new Error("Workflow not found");
      }

      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, workflow[0].projectId));

      if (project.length === 0 || project[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Approve stage
      await approveStage(
        input.workflowId,
        input.stageType,
        ctx.user.id,
        input.approvalComment
      );

      // Create notification
      await db.insert(notifications).values({
        workflowId: input.workflowId,
        userId: ctx.user.id,
        notificationType: "stage_completed",
        title: `Stage ${input.stageType} approved`,
        content: input.approvalComment,
      });

      return { success: true };
    }),

  /**
   * Get stage details
   */
  getStage: protectedProcedure
    .input(z.object({ stageId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(stages)
        .where(eq(stages.id, input.stageId));

      if (result.length === 0) {
        throw new Error("Stage not found");
      }

      return result[0];
    }),
});
