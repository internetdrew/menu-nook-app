import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js";
import {
  menuItemFieldsSchema,
  menuItemImageFieldsSchema,
  normalizeMenuItemDetails,
  normalizeMenuItemTags,
  refineMenuItemImageFields,
} from "../../shared/menuItem.js";

export const menuCategoryItemRouter = router({
  create: protectedProcedure
    .input(
      menuItemFieldsSchema
        .extend({
          menuId: z.uuid(),
          menuCategoryId: z.number(),
          imagePath: menuItemImageFieldsSchema.shape.imagePath,
          imageUrl: menuItemImageFieldsSchema.shape.imageUrl,
        })
        .superRefine((input, ctx) => {
          refineMenuItemImageFields(input, ctx);
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        name,
        primaryTag,
        tags,
        tagline,
        description,
        details,
        price,
        imagePath,
        imageUrl,
        menuCategoryId,
        menuId,
      } = input;

      const { data: newItem, error: newItemError } = await ctx.supabase
        .from("menu_category_items")
        .insert({
          menu_id: menuId,
          menu_category_id: menuCategoryId,
          name,
          primary_tag: primaryTag,
          tags: normalizeMenuItemTags(tags),
          tagline,
          description,
          details: normalizeMenuItemDetails(details),
          price,
          image_path: imagePath,
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

      const { data: lastIndexRow, error: lastIndexError } = await ctx.supabase
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

      const { error: sortInsertError } = await ctx.supabase
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
      menuItemFieldsSchema
        .extend({
          id: z.number(),
          menuCategoryId: z.number(),
          imagePath: menuItemImageFieldsSchema.shape.imagePath,
          imageUrl: menuItemImageFieldsSchema.shape.imageUrl,
        })
        .superRefine((input, ctx) => {
          refineMenuItemImageFields(input, ctx);
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        id,
        name,
        primaryTag,
        tags,
        tagline,
        menuCategoryId,
        description,
        details,
        price,
        imagePath,
        imageUrl,
      } = input;

      const { data: existingItem, error: existingItemError } =
        await ctx.supabase
          .from("menu_category_items")
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
        .from("menu_category_items")
        .update({
          name,
          primary_tag: primaryTag,
          tags: normalizeMenuItemTags(tags),
          tagline,
          description,
          details: normalizeMenuItemDetails(details),
          menu_category_id: menuCategoryId,
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
          .from("menu_item_images")
          .remove([oldImagePath]);

        if (deleteError) {
          console.error("Failed to delete old menu item image:", deleteError);
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
          .from("menu_category_items")
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

      if (existingItem.image_path) {
        const { error: deleteError } = await ctx.supabase.storage
          .from("menu_item_images")
          .remove([existingItem.image_path]);

        if (deleteError) {
          console.error("Failed to delete menu item image:", deleteError);
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
    .mutation(async ({ input, ctx }) => {
      const { categoryId, newItemOrder } = input;

      const offset = 10000;

      for (let index = 0; index < newItemOrder.length; index++) {
        const { indexId } = newItemOrder[index];
        const { error } = await ctx.supabase
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
        const { error } = await ctx.supabase
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
    .query(async ({ input, ctx }) => {
      const { menuCategoryId } = input;

      const { count, error } = await ctx.supabase
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
    .query(async ({ input, ctx }) => {
      const { menuId } = input;

      const { count, error } = await ctx.supabase
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
