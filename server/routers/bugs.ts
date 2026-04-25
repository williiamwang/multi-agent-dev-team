/**
 * Bug Tracking Router
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { bugs, bugReplies, notifications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const bugsRouter = router({
  /**
   * Submit a bug (QA)
   */
  submit: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        relatedTask: z.string().optional(),
        severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
        reproducingSteps: z.string(),
        expected: z.string(),
        actual: z.string(),
        traceback: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate bug ID
      const bugCount = await db
        .select()
        .from(bugs)
        .where(eq(bugs.workflowId, input.workflowId));
      const bugId = `BUG-${String(bugCount.length + 1).padStart(3, "0")}`;

      const result = await db.insert(bugs).values({
        workflowId: input.workflowId,
        bugId,
        relatedTask: input.relatedTask,
        severity: input.severity as any,
        reproducingSteps: input.reproducingSteps,
        expected: input.expected,
        actual: input.actual,
        traceback: input.traceback,
        createdBy: ctx.user.id,
        status: "open",
      });

      return { bugId, success: true };
    }),

  /**
   * List bugs for a workflow
   */
  listByWorkflow: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(bugs)
        .where(eq(bugs.workflowId, input.workflowId));

      return result;
    }),

  /**
   * Get bug details
   */
  getById: protectedProcedure
    .input(z.object({ bugId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(bugs)
        .where(eq(bugs.id, input.bugId));

      if (result.length === 0) {
        throw new Error("Bug not found");
      }

      return result[0];
    }),

  /**
   * Update bug status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        bugId: z.number(),
        status: z.enum(["open", "in_progress", "fixed", "verified", "closed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(bugs)
        .set({ status: input.status as any })
        .where(eq(bugs.id, input.bugId));

      return { success: true };
    }),

  /**
   * Submit bug reply (Dev)
   */
  submitReply: protectedProcedure
    .input(
      z.object({
        bugId: z.number(),
        replyType: z.enum(["hotfix", "refactor_proposal"]),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(bugReplies).values({
        bugId: input.bugId,
        replyType: input.replyType as any,
        content: input.content,
        createdBy: ctx.user.id,
      });

      // Update bug status
      await db
        .update(bugs)
        .set({ status: "in_progress" })
        .where(eq(bugs.id, input.bugId));

      return { success: true };
    }),

  /**
   * Get bug replies
   */
  getReplies: protectedProcedure
    .input(z.object({ bugId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(bugReplies)
        .where(eq(bugReplies.bugId, input.bugId));

      return result;
    }),
});
