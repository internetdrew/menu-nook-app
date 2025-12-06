import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const subscriptionRouter = router({
  getForPlace: protectedProcedure
    .input(z.object({ placeId: z.string() }))
    .query(async ({ input }) => {
      const { data: place, error } = await supabaseAdminClient
        .from("subscriptions")
        .select("*")
        .eq("place_id", input.placeId)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return place;
    }),
});
