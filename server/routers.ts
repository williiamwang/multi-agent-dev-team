import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { workflowRouter } from "./routers/workflow";
import { documentRouter } from "./routers/documents";
import { tasksRouter } from "./routers/tasks";
import { bugsRouter } from "./routers/bugs";
import { disputesRouter } from "./routers/disputes";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Multi-agent workflow system routers
  workflows: workflowRouter,
  documents: documentRouter,
  tasks: tasksRouter,
  bugs: bugsRouter,
  disputes: disputesRouter,
});

export type AppRouter = typeof appRouter;
