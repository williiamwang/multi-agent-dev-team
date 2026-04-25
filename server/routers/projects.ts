import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const projectsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(projects).values({
        name: input.name,
        description: input.description || "",
        status: input.status,
        ownerId: ctx.user.id,
      });

      // Get the inserted project
      const inserted = await db
        .select()
        .from(projects)
        .orderBy((t) => t.id)
        .limit(1);

      return { success: true, id: inserted[0]?.id || 0 };
    }),

  getById: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      return result[0] || null;
    }),

  listByOwner: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, ctx.user.id));

    return result;
  }),

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "active", "completed", "archived"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (!project[0] || project[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const updateData: any = { updatedAt: new Date() };
      if (input.name) updateData.name = input.name;
      if (input.description) updateData.description = input.description;
      if (input.status) updateData.status = input.status;

      await db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, input.projectId));

      return { success: true };
    }),
});
