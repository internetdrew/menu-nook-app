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
        placeId: z.uuid(),
        price: z.number().min(0),
        imageUrl: z.url().optional(),
        categoryId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, placeId, description, price, imageUrl, categoryId } = input;

      const { data: newItem, error: newItemError } = await supabaseAdminClient
        .from("place_items")
        .insert({
          place_id: placeId,
          name,
          description,
          category_id: categoryId,
          price,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (newItemError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create category: ${newItemError.message}`,
        });
      }

      const { data: lastIndexRow, error: lastIndexError } =
        await supabaseAdminClient
          .from("item_sort_indexes")
          .select("order_index")
          .eq("category_id", categoryId)
          .order("order_index", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (lastIndexError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch item sort index: ${lastIndexError.message}`,
        });
      }

      const nextIndex =
        lastIndexRow?.order_index === null ||
        lastIndexRow?.order_index === undefined
          ? 0
          : lastIndexRow.order_index + 1;

      const { error: sortInsertError } = await supabaseAdminClient
        .from("item_sort_indexes")
        .insert({
          category_id: categoryId,
          item_id: newItem.id,
          order_index: nextIndex,
        });

      if (sortInsertError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create item sort index: ${sortInsertError.message}`,
        });
      }

      return newItem;
    }),
  getAllByPlace: protectedProcedure
    .input(
      z.object({
        placeId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { placeId } = input;

      const { data, error } = await supabaseAdminClient
        .from("place_items")
        .select("*, category:place_categories(id,name)")
        .eq("place_id", placeId)
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
        placeId: z.uuid(),
        price: z.number().min(0),
        imageUrl: z.url().optional(),
        categoryId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, name, placeId, description, price, imageUrl, categoryId } =
        input;

      const { data, error } = await supabaseAdminClient
        .from("place_items")
        .update({
          name,
          description,
          category_id: categoryId,
          price,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("place_id", placeId)
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
        .from("place_items")
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
  getAllForCategorySortedByIndex: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().nullable(),
      }),
    )
    .query(async ({ input }) => {
      const { categoryId } = input;

      if (categoryId === null) {
        return [];
      }

      const { data, error } = await supabaseAdminClient
        .from("item_sort_indexes")
        .select("*, item:place_items(*, category:place_categories(id,name))")
        .eq("category_id", categoryId)
        .order("order_index", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch items by category index: ${error.message}`,
        });
      }

      return data;
    }),
  updateOrder: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
        newItemOrder: z.array(
          z.object({
            indexId: z.number(),
            itemId: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { categoryId, newItemOrder } = input;

      const offset = 10000;

      for (let index = 0; index < newItemOrder.length; index++) {
        const { indexId } = newItemOrder[index];
        const { error } = await supabaseAdminClient
          .from("item_sort_indexes")
          .update({ order_index: offset + index })
          .eq("id", indexId)
          .select();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update item order: ${error.message}`,
          });
        }
      }

      for (let index = 0; index < newItemOrder.length; index++) {
        const { itemId } = newItemOrder[index];
        const { error } = await supabaseAdminClient
          .from("item_sort_indexes")
          .update({ order_index: index })
          .eq("category_id", categoryId)
          .eq("item_id", itemId)
          .select();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update item order: ${error.message}`,
          });
        }
      }

      return { success: true };
    }),
});
