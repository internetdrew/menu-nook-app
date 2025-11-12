import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const categoryRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        restaurantId: z.uuid(),
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, restaurantId, description } = input;

      const { data, error } = await supabaseAdminClient
        .from("restaurant_categories")
        .insert({
          restaurant_id: restaurantId,
          name,
          description,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create category: ${error.message}`,
        });
      }

      return data;
    }),
  getAllByRestaurant: protectedProcedure
    .input(
      z.object({
        restaurantId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { restaurantId } = input;

      const { data, error } = await supabaseAdminClient
        .from("restaurant_categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch categories: ${error.message}`,
        });
      }

      return data;
    }),
});
