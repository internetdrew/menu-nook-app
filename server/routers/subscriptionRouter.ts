import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const subscriptionRouter = router({
  getForMenu: publicProcedure
    .input(z.object({ menuId: z.uuid() }))
    .query(async ({ input }) => {
      const { data: subscription, error } = await supabaseAdminClient
        .from("subscriptions")
        .select("*")
        .eq("menu_id", input.menuId)
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
