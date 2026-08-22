import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js";
import { storeCategoryFieldsSchema } from "../../shared/storeCategory.js";

export const storeCategoryRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        storeId: z.uuid(),
      }).extend(storeCategoryFieldsSchema.shape),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, storeId, description } = input;

      const { data, error } = await ctx.supabase
        .from("store_menu_category_sort_indexes")
        .select("order_index")
        .eq("store_id", storeId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch category order index: ${error.message}`,
        });
      }

      const nextIndex =
        data?.order_index === null || data?.order_index === undefined
          ? 0
          : data.order_index + 1;

      const { data: newCategory, error: createCategoryError } =
        await ctx.supabase
          .from("store_menu_categories")
          .insert({
            name,
            store_id: storeId,
            description,
          })
          .select()
          .single();

      if (createCategoryError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create category: ${createCategoryError.message}`,
        });
      }

      const { error: sortIndexError } = await ctx.supabase
        .from("store_menu_category_sort_indexes")
        .insert({
          category_id: newCategory.id,
          store_id: storeId,
          order_index: nextIndex,
        });

      if (sortIndexError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create category sort index: ${sortIndexError.message}`,
        });
      }
      return newCategory;
    }),
  getAllSortedByIndex: protectedProcedure
    .input(
      z.object({
        storeId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { storeId } = input;
      const { data, error } = await ctx.supabase
        .from("store_menu_category_sort_indexes")
        .select(`*, category:store_menu_categories(*)`)
        .eq("store_id", storeId)
        .order("order_index", { ascending: true });

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
        categoryId: z.number(),
      }).extend(storeCategoryFieldsSchema.shape),
    )
    .mutation(async ({ input, ctx }) => {
      const { categoryId, name, description } = input;

      const { data, error: updateCategoryError } = await ctx.supabase
        .from("store_menu_categories")
        .update({
          name,
          description,
        })
        .eq("id", categoryId)
        .select()
        .single();

      if (updateCategoryError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update category: ${updateCategoryError.message}`,
        });
      }

      return data;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { categoryId } = input;

      const { data, error: deleteCategoryError } = await ctx.supabase
        .from("store_menu_categories")
        .delete()
        .eq("id", categoryId)
        .select()
        .single();

      if (deleteCategoryError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete category: ${deleteCategoryError.message}`,
        });
      }

      return data;
    }),
  updateOrder: protectedProcedure
    .input(
      z.object({
        storeId: z.uuid().nullable(),
        newCategoryOrder: z.array(
          z.object({
            indexId: z.number(),
            categoryId: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { storeId, newCategoryOrder } = input;

      if (storeId === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Store ID cannot be null when updating category order.",
        });
      }

      const offset = 10000;
      for (let index = 0; index < newCategoryOrder.length; index++) {
        const { indexId } = newCategoryOrder[index];

        const { error } = await ctx.supabase
          .from("store_menu_category_sort_indexes")
          .update({ order_index: offset + index })
          .eq("id", indexId)
          .select();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update category order: ${error.message}`,
          });
        }
      }

      for (let index = 0; index < newCategoryOrder.length; index++) {
        const { categoryId } = newCategoryOrder[index];

        const { error } = await ctx.supabase
          .from("store_menu_category_sort_indexes")
          .update({ order_index: index })
          .eq("store_id", storeId)
          .eq("category_id", categoryId)
          .select();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update category order: ${error.message}`,
          });
        }
      }

      return { success: true };
    }),
  getById: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { categoryId } = input;
      const { data, error } = await ctx.supabase
        .from("store_menu_categories")
        .select("*")
        .eq("id", categoryId)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch category: ${error.message}`,
        });
      }
      return data;
    }),
  getCountByStoreId: protectedProcedure
    .input(
      z.object({
        storeId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { storeId } = input;
      const { count, error } = await ctx.supabase
        .from("store_menu_categories")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch category count: ${error.message}`,
        });
      }
      return count ?? 0;
    }),
});
