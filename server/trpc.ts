import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createServerSupabaseClient } from "./supabase";

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  const supabase = createServerSupabaseClient(req, res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    req,
    res,
    user,
    supabase,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      supabase: ctx.supabase,
    },
  });
});
