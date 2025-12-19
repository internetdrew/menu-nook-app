import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const subscriptionRouter = router({
  getForUser: protectedProcedure.query(async ({ ctx }) => {
    const { data: subscription, error } = await supabaseAdminClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return subscription;
  }),
});
