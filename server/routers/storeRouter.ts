import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { supabaseAdminClient } from "../supabase.js";
import { storeNameSchema } from "../../shared/storeName.js";
import { storeSlugSchema } from "../../shared/storeSlug.js";
import {
  checkStoreSlugAvailability,
  isStoreSlugUniqueViolation,
} from "../utils/storeSlug.js";
import { fetchStoreWithCategories } from "../utils/fetchStoreWithCategories.js";

export const storeRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: storeNameSchema,
        slug: storeSlugSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const availability = await checkStoreSlugAvailability(
        supabaseAdminClient,
        input.slug,
      );

      if (!availability.available) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: availability.message,
        });
      }

      const { data: store, error } = await ctx.supabase
        .from("stores")
        .insert({
          name: input.name,
          menu_slug: input.slug,
          user_id: ctx.user.id,
        })
        .select()
        .single();

      if (error) {
        if (isStoreSlugUniqueViolation(error)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That link is already taken.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return store;
    }),
  getForUser: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("stores")
      .select()
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data;
  }),
  checkSlugAvailability: protectedProcedure
    .input(
      z.object({
        storeId: z.uuid().optional(),
        slug: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (input.storeId) {
        const { data: store, error } = await ctx.supabase
          .from("stores")
          .select("id")
          .eq("id", input.storeId)
          .eq("user_id", ctx.user.id)
          .maybeSingle();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        if (!store) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this store.",
          });
        }
      }

      return checkStoreSlugAvailability(supabaseAdminClient, input.slug, {
        excludeStoreId: input.storeId,
      });
    }),
  update: protectedProcedure
    .input(
      z
        .object({
          id: z.uuid(),
          imagePath: z.string().nullable().optional(),
          imageUrl: z.url().nullable().optional(),
          name: storeNameSchema.optional(),
          seoTitle: z.string().max(80).nullable().optional(),
          seoDescription: z.string().max(180).nullable().optional(),
        })
        .superRefine((input, ctx) => {
          if (
            input.name === undefined &&
            input.seoTitle === undefined &&
            input.seoDescription === undefined &&
            input.imageUrl === undefined &&
            input.imagePath === undefined
          ) {
            ctx.addIssue({
              code: "custom",
              message: "At least one field must be provided",
              path: ["name"],
            });
          }

          const logoUrlProvided = input.imageUrl !== undefined;
          const logoPathProvided = input.imagePath !== undefined;

          if (logoUrlProvided !== logoPathProvided) {
            ctx.addIssue({
              code: "custom",
              message: "Logo updates must include both imageUrl and imagePath",
              path: ["imageUrl"],
            });
          }

          if (input.imageUrl === null && input.imagePath !== null) {
            ctx.addIssue({
              code: "custom",
              message: "Removing a logo must clear both imageUrl and imagePath",
              path: ["imagePath"],
            });
          }

          if (input.imagePath === null && input.imageUrl !== null) {
            ctx.addIssue({
              code: "custom",
              message: "Removing a logo must clear both imageUrl and imagePath",
              path: ["imageUrl"],
            });
          }
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: existingStore, error: existingStoreError } =
        await ctx.supabase
          .from("stores")
          .select("id, image_path")
          .eq("id", input.id)
          .eq("user_id", ctx.user.id)
          .single();

      if (existingStoreError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: existingStoreError.message,
        });
      }

      const { data, error } = await ctx.supabase
        .from("stores")
        .update({
          image_path: input.imagePath,
          image_url: input.imageUrl,
          name: input.name,
          menu_seo_title: input.seoTitle,
          menu_seo_description: input.seoDescription,
        })
        .eq("id", input.id)
        .eq("user_id", ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const oldImagePath = existingStore.image_path;
      const nextImagePath = input.imagePath;
      const shouldDeleteOldLogo =
        input.imagePath !== undefined &&
        oldImagePath &&
        oldImagePath !== nextImagePath;

      if (shouldDeleteOldLogo) {
        const { error: deleteError } = await ctx.supabase.storage
          .from("store_logos")
          .remove([oldImagePath]);

        if (deleteError) {
          console.error("Failed to delete old store logo:", deleteError);
        }
      }

      return data;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        storeId: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from("stores")
        .delete()
        .eq("id", input.storeId)
        .eq("user_id", ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),
  getPreview: protectedProcedure
    .input(z.object({ storeId: z.uuid() }))
    .query(async ({ input, ctx }) => {
      const { data: store, error } = await ctx.supabase
        .from("stores")
        .select("id")
        .eq("id", input.storeId)
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      if (!store) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this store.",
        });
      }

      return fetchStoreWithCategories(ctx.supabase, { storeId: input.storeId });
    }),
  getPublic: publicProcedure
    .input(z.object({ storeSlug: z.string() }))
    .query(async ({ input }) => {
      return fetchStoreWithCategories(supabaseAdminClient, {
        storeSlug: input.storeSlug,
      });
    }),
});
