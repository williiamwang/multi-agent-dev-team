import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { generateTokenPair, verifyToken, extractTokenFromHeader } from "../auth/jwt";
import { findUserByEmail, findUserByOpenId } from "../auth/local";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const authRouter = router({
  /**
   * Get current authenticated user
   */
  me: publicProcedure.query(({ ctx }) => ctx.user),

  /**
   * Login with email and password (placeholder - implement actual password verification)
   */
  loginLocal: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByEmail(input.email);

      if (!user) {
        throw new Error("Invalid credentials");
      }

      // TODO: Implement actual password verification with bcrypt
      // For now, just return tokens for any valid user

      const tokens = generateTokenPair({
        userId: user.id,
        openId: user.openId,
        email: user.email || undefined,
        role: user.role,
      });

      return {
        user,
        tokens,
      };
    }),

  /**
   * Refresh access token using refresh token
   */
  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      const payload = verifyToken(input.refreshToken);

      if (!payload) {
        throw new Error("Invalid refresh token");
      }

      const user = await findUserByOpenId(payload.openId);

      if (!user) {
        throw new Error("User not found");
      }

      const tokens = generateTokenPair({
        userId: user.id,
        openId: user.openId,
        email: user.email || undefined,
        role: user.role,
      });

      return { tokens };
    }),

  /**
   * Logout (client-side token deletion)
   */
  logout: protectedProcedure.mutation(() => {
    return { success: true };
  }),

  /**
   * Verify token validity
   */
  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(({ input }) => {
      const payload = verifyToken(input.token);
      return { valid: payload !== null, payload };
    }),

  /**
   * Get user by ID (admin only)
   */
  getUserById: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    }),

  /**
   * List all users (admin only)
   */
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db.select().from(users);
  }),

  /**
   * Update user role (admin only)
   */
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

      return { success: true };
    }),
});
