import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";

export const subscriptionRouter = router({
  getForBusiness: publicProcedure
    .input(z.object({ businessId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: subscription, error } = await ctx.supabase
        .from("subscriptions")
        .select("*")
        .eq("business_id", input.businessId)
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
