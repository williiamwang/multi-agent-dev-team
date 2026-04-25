/**
 * Dispute Resolution Router
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { disputes, disputeRounds, notifications } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const disputesRouter = router({
  /**
   * Create a new dispute
   */
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        relatedTask: z.string().optional(),
        initiatedRole: z.enum(["Dev", "PM"]),
        issue: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(disputes).values({
        workflowId: input.workflowId,
        relatedTask: input.relatedTask,
        initiatedBy: ctx.user.id,
        initiatedRole: input.initiatedRole as any,
        issue: input.issue,
        status: "open",
        roundCount: 0,
      });

      return { disputeId: result[0]?.insertId, success: true };
    }),

  /**
   * List disputes for a workflow
   */
  listByWorkflow: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(disputes)
        .where(eq(disputes.workflowId, input.workflowId));

      return result;
    }),

  /**
   * Get dispute details
   */
  getById: protectedProcedure
    .input(z.object({ disputeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(disputes)
        .where(eq(disputes.id, input.disputeId));

      if (result.length === 0) {
        throw new Error("Dispute not found");
      }

      return result[0];
    }),

  /**
   * Submit a dispute round (Dev or PM)
   */
  submitRound: protectedProcedure
    .input(
      z.object({
        disputeId: z.number(),
        fromRole: z.enum(["Dev", "PM"]),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get dispute
      const disputeRecords = await db
        .select()
        .from(disputes)
        .where(eq(disputes.id, input.disputeId));

      if (disputeRecords.length === 0) {
        throw new Error("Dispute not found");
      }

      const dispute = disputeRecords[0];

      // Check if max rounds reached
      if (dispute.roundCount >= 3) {
        throw new Error("Maximum discussion rounds reached");
      }

      // Add round
      const roundNumber = dispute.roundCount + 1;
      await db.insert(disputeRounds).values({
        disputeId: input.disputeId,
        roundNumber,
        fromRole: input.fromRole as any,
        content: input.content,
      });

      // Update dispute
      let newStatus = "in_discussion";
      if (roundNumber >= 3) {
        newStatus = "architect_review";
      }

      await db
        .update(disputes)
        .set({
          roundCount: roundNumber,
          status: newStatus as any,
        })
        .where(eq(disputes.id, input.disputeId));

      return { roundNumber, success: true };
    }),

  /**
   * Get dispute rounds
   */
  getRounds: protectedProcedure
    .input(z.object({ disputeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(disputeRounds)
        .where(eq(disputeRounds.disputeId, input.disputeId));

      return result;
    }),

  /**
   * Submit architect arbitration
   */
  submitArchitectDecision: protectedProcedure
    .input(
      z.object({
        disputeId: z.number(),
        decision: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(disputes)
        .set({
          architectDecision: input.decision,
          status: "owner_decision",
        })
        .where(eq(disputes.id, input.disputeId));

      return { success: true };
    }),

  /**
   * Submit owner decision (final)
   */
  submitOwnerDecision: protectedProcedure
    .input(
      z.object({
        disputeId: z.number(),
        decision: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(disputes)
        .set({
          ownerDecision: input.decision,
          status: "resolved",
        })
        .where(eq(disputes.id, input.disputeId));

      // Create notification
      const disputeRecords = await db
        .select()
        .from(disputes)
        .where(eq(disputes.id, input.disputeId));

      if (disputeRecords.length > 0) {
        await db.insert(notifications).values({
          workflowId: disputeRecords[0].workflowId,
          userId: ctx.user.id,
          notificationType: "dispute_escalated",
          title: "Dispute resolved",
          content: input.decision,
          relatedEntityId: input.disputeId,
        });
      }

      return { success: true };
    }),
});
