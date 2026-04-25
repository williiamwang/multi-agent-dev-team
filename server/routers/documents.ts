/**
 * Document Management Router
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { documents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const documentRouter = router({
  /**
   * List all documents for a workflow
   */
  listByWorkflow: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(documents)
        .where(eq(documents.workflowId, input.workflowId));

      return result;
    }),

  /**
   * Get document by ID
   */
  getById: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId));

      if (result.length === 0) {
        throw new Error("Document not found");
      }

      return result[0];
    }),

  /**
   * Create or update document
   */
  upsert: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        stageId: z.number(),
        docType: z.enum([
          "PRD",
          "Architecture",
          "APIContract",
          "TaskList",
          "SelfTestReport",
          "TestReport",
          "ResearchReport",
        ]),
        title: z.string(),
        content: z.string(),
        fileUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(documents)
        .where(eq(documents.stageId, input.stageId));

      if (existing.length > 0) {
        // Update
        await db
          .update(documents)
          .set({
            title: input.title,
            content: input.content,
            fileUrl: input.fileUrl,
          })
          .where(eq(documents.id, existing[0].id));

        return existing[0];
      } else {
        // Create
        const result = await db.insert(documents).values({
          workflowId: input.workflowId,
          stageId: input.stageId,
          docType: input.docType as any,
          title: input.title,
          content: input.content,
          fileUrl: input.fileUrl,
        });

        return result;
      }
    }),
});
