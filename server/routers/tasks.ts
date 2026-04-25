/**
 * Atomic Tasks Router\n */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { atomicTasks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const tasksRouter = router({
  /**
   * List all atomic tasks for a workflow
   */
  listByWorkflow: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(atomicTasks)
        .where(eq(atomicTasks.workflowId, input.workflowId));

      return result;
    }),

  /**
   * Get task by ID
   */
  getById: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(atomicTasks)
        .where(eq(atomicTasks.id, input.taskId));

      if (result.length === 0) {
        throw new Error("Task not found");
      }

      return result[0];
    }),

  /**
   * Update task status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(atomicTasks)
        .set({ status: input.status as any })
        .where(eq(atomicTasks.id, input.taskId));

      return { success: true };
    }),

  /**
   * List tasks by category
   */
  listByCategory: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        category: z.enum(["frontend", "backend", "infrastructure"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(atomicTasks)
        .where(
          eq(atomicTasks.workflowId, input.workflowId) &&
            eq(atomicTasks.category, input.category as any)
        );

      return result;
    }),
});
