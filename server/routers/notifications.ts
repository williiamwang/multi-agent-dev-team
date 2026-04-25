import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const notificationsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        notificationType: z.enum(["stage_completed", "approval_required", "bug_assigned", "dispute_escalated"]),
        title: z.string(),
        content: z.string().optional(),
        relatedEntityId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(notifications).values({
        workflowId: input.workflowId,
        userId: ctx.user.id,
        notificationType: input.notificationType,
        title: input.title,
        content: input.content || "",
        relatedEntityId: input.relatedEntityId,
        status: "unread",
      });

      return { success: true };
    }),

  listByUser: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy((t) => t.createdAt);

    return result;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const notif = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId))
        .limit(1);

      if (!notif[0] || notif[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db
        .update(notifications)
        .set({ status: "read" })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(notifications)
      .set({ status: "read" })
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const notif = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId))
        .limit(1);

      if (!notif[0] || notif[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db.delete(notifications).where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.status, "unread")));

    return { count: result.length };
  }),
});
