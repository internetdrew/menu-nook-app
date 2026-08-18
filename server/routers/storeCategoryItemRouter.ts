import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js";
import {
  storeItemFieldsSchema,
  storeItemImageFieldsSchema,
  refineStoreItemImageFields,
} from "../../shared/storeItem.js";

export const storeCategoryItemRouter = router({
  create: protectedProcedure
    .input(
      storeItemFieldsSchema
        .extend({
          storeId: z.uuid(),
          storeCategoryId: z.number(),
          imagePath: storeItemImageFieldsSchema.shape.imagePath,
          imageUrl: storeItemImageFieldsSchema.shape.imageUrl,
        })
        .superRefine((input, ctx) => {
          refineStoreItemImageFields(input, ctx);
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        name,
        description,
        price,
        imagePath,
        imageUrl,
        storeCategoryId,
        storeId,
      } = input;

      const { data: newItem, error: newItemError } = await ctx.supabase
        .from("store_menu_category_items")
        .insert({
          store_id: storeId,
          store_menu_category_id: storeCategoryId,
          name,
          description,
          price,
          image_path: imagePath,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (newItemError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create item: ${newItemError.message}`,
        });
      }

      const { data: lastIndexRow, error: lastIndexError } = await ctx.supabase
        .from("store_menu_category_item_sort_indexes")
        .select("order_index")
        .eq("store_menu_category_id", storeCategoryId)
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

      const { error: sortInsertError } = await ctx.supabase
        .from("store_menu_category_item_sort_indexes")
        .insert({
          store_menu_category_id: storeCategoryId,
          store_menu_category_item_id: newItem.id,
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
      storeItemFieldsSchema
        .extend({
          id: z.number(),
          storeCategoryId: z.number(),
          imagePath: storeItemImageFieldsSchema.shape.imagePath,
          imageUrl: storeItemImageFieldsSchema.shape.imageUrl,
        })
        .superRefine((input, ctx) => {
          refineStoreItemImageFields(input, ctx);
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        id,
        name,
        storeCategoryId,
        description,
        price,
        imagePath,
        imageUrl,
      } = input;

      const { data: existingItem, error: existingItemError } =
        await ctx.supabase
          .from("store_menu_category_items")
          .select("id, image_path")
          .eq("id", id)
          .single();

      if (existingItemError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch existing item: ${existingItemError.message}`,
        });
      }

      const { data, error } = await ctx.supabase
        .from("store_menu_category_items")
        .update({
          name,
          description,
          store_menu_category_id: storeCategoryId,
          price,
          image_path: imagePath,
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

      const oldImagePath = existingItem.image_path;
      const nextImagePath = input.imagePath;
      const shouldDeleteOldImage =
        input.imagePath !== undefined &&
        oldImagePath &&
        oldImagePath !== nextImagePath;

      if (shouldDeleteOldImage) {
        const { error: deleteError } = await ctx.supabase.storage
          .from("store_item_images")
          .remove([oldImagePath]);

        if (deleteError) {
          console.error("Failed to delete old store item image:", deleteError);
        }
      }

      return data;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const { data: existingItem, error: existingItemError } =
        await ctx.supabase
          .from("store_menu_category_items")
          .select("id, image_path")
          .eq("id", id)
          .single();

      if (existingItemError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch existing item: ${existingItemError.message}`,
        });
      }

      const { data, error } = await ctx.supabase
        .from("store_menu_category_items")
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

      if (existingItem.image_path) {
        const { error: deleteError } = await ctx.supabase.storage
          .from("store_item_images")
          .remove([existingItem.image_path]);

        if (deleteError) {
          console.error("Failed to delete store item image:", deleteError);
        }
      }

      return data;
    }),
  getSortedForCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().nullable(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { categoryId } = input;

      if (categoryId === null) {
        return [];
      }

      const { data, error } = await ctx.supabase
        .from("store_menu_category_item_sort_indexes")
        .select(
          "*, item:store_menu_category_items(*, category:store_menu_categories(id,name))",
        )
        .eq("store_menu_category_id", categoryId)
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
    .mutation(async ({ input, ctx }) => {
      const { categoryId, newItemOrder } = input;

      const offset = 10000;

      for (let index = 0; index < newItemOrder.length; index++) {
        const { indexId } = newItemOrder[index];
        const { error } = await ctx.supabase
          .from("store_menu_category_item_sort_indexes")
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
        const { error } = await ctx.supabase
          .from("store_menu_category_item_sort_indexes")
          .update({ order_index: index })
          .eq("store_menu_category_id", categoryId)
          .eq("store_menu_category_item_id", itemId)
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
  getCountByStoreCategoryId: protectedProcedure
    .input(
      z.object({
        storeCategoryId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { storeCategoryId } = input;

      const { count, error } = await ctx.supabase
        .from("store_menu_category_items")
        .select("id", { count: "exact", head: true })
        .eq("store_menu_category_id", storeCategoryId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch item count: ${error.message}`,
        });
      }

      return count ?? 0;
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
        .from("store_menu_category_items")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch item count by store id: ${error.message}`,
        });
      }

      return count ?? 0;
    }),
});
