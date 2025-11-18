import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const menuRouter = router({
  getForPlace: publicProcedure
    .input(
      z.object({
        placeId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { data: place, error: placeError } = await supabaseAdminClient
        .from("places")
        .select("*")
        .eq("id", input.placeId)
        .single();

      if (placeError || !place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Place not found",
        });
      }

      const { data: categoryIndexes, error: categoryError } =
        await supabaseAdminClient
          .from("category_sort_indexes")
          .select(
            `
            id,
            order_index,
            category:place_categories(*)
          `,
          )
          .eq("place_id", input.placeId)
          .order("order_index", { ascending: true });

      if (categoryError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: categoryError.message,
        });
      }

      const categoriesWithItems = await Promise.all(
        (categoryIndexes ?? []).map(async (catIndex) => {
          const { data: itemIndexes, error: itemError } =
            await supabaseAdminClient
              .from("item_sort_indexes")
              .select(
                `
                id,
                order_index,
                item:place_items(*)
              `,
              )
              .eq("category_id", catIndex.category.id)
              .order("order_index", { ascending: true });

          if (itemError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: itemError.message,
            });
          }

          return {
            ...catIndex.category,
            items: (itemIndexes ?? []).map((idx) => idx.item),
          };
        }),
      );

      return {
        place: place,
        categories: categoriesWithItems,
      };
    }),
});
