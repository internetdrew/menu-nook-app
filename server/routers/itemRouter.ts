import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const itemRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        restaurantId: z.uuid(),
        price: z.number().min(0),
        imageUrl: z.url().optional(),
        categoryId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, restaurantId, description, price, imageUrl, categoryId } =
        input;

      const { data, error } = await supabaseAdminClient
        .from("restaurant_items")
        .insert({
          restaurant_id: restaurantId,
          name,
          description,
          category_id: categoryId,
          price,
          image_url: imageUrl,
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
        .from("restaurant_items")
        .select("*, category:restaurant_categories(name)")
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
