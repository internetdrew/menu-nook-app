import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc.js";
import { supabaseAdminClient } from "../supabase.js";

export const subscriptionRouter = router({
  getForStore: publicProcedure
    .input(z.object({ storeId: z.uuid() }))
    .query(async ({ input }) => {
      const { data: subscription, error } = await supabaseAdminClient
        .from("subscriptions")
        .select("*")
        .eq("store_id", input.storeId)
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
