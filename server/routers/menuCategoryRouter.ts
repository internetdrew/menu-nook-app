import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const menuCategoryRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, menuId, description } = input;

      const { data, error } = await supabaseAdminClient
        .from("menu_category_sort_indexes")
        .select("order_index")
        .eq("menu_id", menuId)
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
        await supabaseAdminClient
          .from("menu_categories")
          .insert({
            name,
            menu_id: menuId,
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

      const { error: sortIndexError } = await supabaseAdminClient
        .from("menu_category_sort_indexes")
        .insert({
          category_id: newCategory.id,
          menu_id: menuId,
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
        menuId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { menuId } = input;
      const { data, error } = await supabaseAdminClient
        .from("menu_category_sort_indexes")
        .select(`*, category:menu_categories(*)`)
        .eq("menu_id", menuId)
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
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { categoryId, name, description } = input;

      const { data, error: updateCategoryError } = await supabaseAdminClient
        .from("menu_categories")
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
    .mutation(async ({ input }) => {
      const { categoryId } = input;

      const { data, error: deleteCategoryError } = await supabaseAdminClient
        .from("menu_categories")
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
        menuId: z.uuid().nullable(),
        newCategoryOrder: z.array(
          z.object({
            indexId: z.number(),
            categoryId: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { menuId, newCategoryOrder } = input;

      if (menuId === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Menu ID cannot be null when updating category order.",
        });
      }

      const offset = 10000;
      for (let index = 0; index < newCategoryOrder.length; index++) {
        const { indexId } = newCategoryOrder[index];

        const { error } = await supabaseAdminClient
          .from("menu_category_sort_indexes")
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

        const { error } = await supabaseAdminClient
          .from("menu_category_sort_indexes")
          .update({ order_index: index })
          .eq("menu_id", menuId)
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
    .query(async ({ input }) => {
      const { categoryId } = input;
      const { data, error } = await supabaseAdminClient
        .from("menu_categories")
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
  getCountByMenuId: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { menuId } = input;
      const { count, error } = await supabaseAdminClient
        .from("menu_categories")
        .select("id", { count: "exact", head: true })
        .eq("menu_id", menuId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch category count: ${error.message}`,
        });
      }
      return count ?? 0;
    }),
});
