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
        .select("*, category:restaurant_categories(id,name)")
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
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        restaurantId: z.uuid(),
        price: z.number().min(0),
        imageUrl: z.url().optional(),
        categoryId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        id,
        name,
        restaurantId,
        description,
        price,
        imageUrl,
        categoryId,
      } = input;

      const { data, error } = await supabaseAdminClient
        .from("restaurant_items")
        .update({
          name,
          description,
          category_id: categoryId,
          price,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update item: ${error.message}`,
        });
      }

      return data;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id } = input;
      const { data, error } = await supabaseAdminClient
        .from("restaurant_items")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete item: ${error.message}`,
        });
      }

      return data;
    }),
});
