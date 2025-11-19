import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const categoryRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        placeId: z.uuid(),
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, placeId, description } = input;

      const { data, error } = await supabaseAdminClient
        .from("category_sort_indexes")
        .select("order_index")
        .eq("place_id", placeId)
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
          .from("place_categories")
          .insert({
            name,
            place_id: placeId,
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
        .from("category_sort_indexes")
        .insert({
          category_id: newCategory.id,
          place_id: placeId,
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
        placeId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { placeId } = input;
      const { data, error } = await supabaseAdminClient
        .from("category_sort_indexes")
        .select(`*, category:place_categories(*, place_items(*))`)
        .eq("place_id", placeId)
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
        .from("place_categories")
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
        .from("place_categories")
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
        placeId: z.string(),
        newCategoryOrder: z.array(
          z.object({
            indexId: z.number(),
            categoryId: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { placeId, newCategoryOrder } = input;

      const offset = 10000;
      for (let index = 0; index < newCategoryOrder.length; index++) {
        const { indexId } = newCategoryOrder[index];

        const { error } = await supabaseAdminClient
          .from("category_sort_indexes")
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
          .from("category_sort_indexes")
          .update({ order_index: index })
          .eq("place_id", placeId)
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
        .from("place_categories")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch category: ${error.message}`,
        });
      }
      return data;
    }),
});
