import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const menuCategoryItemRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
        menuCategoryId: z.number(),
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        price: z.number().min(0),
        imageUrl: z.url().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, description, price, imageUrl, menuCategoryId, menuId } =
        input;

      const { data: newItem, error: newItemError } = await supabaseAdminClient
        .from("menu_category_items")
        .insert({
          menu_id: menuId,
          menu_category_id: menuCategoryId,
          name,
          description,
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
          .from("menu_category_item_sort_indexes")
          .select("order_index")
          .eq("menu_category_id", menuCategoryId)
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
        .from("menu_category_item_sort_indexes")
        .insert({
          menu_category_id: menuCategoryId,
          menu_category_item_id: newItem.id,
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
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        price: z.number().min(0),
        imageUrl: z.url().optional(),
        menuCategoryId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, name, menuCategoryId, description, price, imageUrl } = input;

      const { data, error } = await supabaseAdminClient
        .from("menu_category_items")
        .update({
          name,
          description,
          menu_category_id: menuCategoryId,
          price,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
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
        .from("menu_category_items")
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
  getSortedForCategory: protectedProcedure
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
        .from("menu_category_item_sort_indexes")
        .select(
          "*, item:menu_category_items(*, category:menu_categories(id,name))",
        )
        .eq("menu_category_id", categoryId)
        .order("order_index", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch items by category index: ${error.message}`,
        });
      }

      return data;
    }),
  updateSortOrder: protectedProcedure
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
          .from("menu_category_item_sort_indexes")
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
          .from("menu_category_item_sort_indexes")
          .update({ order_index: index })
          .eq("menu_category_id", categoryId)
          .eq("menu_category_item_id", itemId)
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
  getCountByMenuCategoryId: protectedProcedure
    .input(
      z.object({
        menuCategoryId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const { menuCategoryId } = input;

      const { count, error } = await supabaseAdminClient
        .from("menu_category_items")
        .select("id", { count: "exact", head: true })
        .eq("menu_category_id", menuCategoryId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch item count: ${error.message}`,
        });
      }

      return count ?? 0;
    }),
  getCountByMenuId: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { menuId } = input;

      const { count, error } = await supabaseAdminClient
        .from("menu_category_items")
        .select("*", { count: "exact", head: true })
        .eq("menu_id", menuId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch item count by menu id: ${error.message}`,
        });
      }

      return count ?? 0;
    }),
});
