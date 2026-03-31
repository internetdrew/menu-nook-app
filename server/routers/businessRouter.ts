import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";

export const businessRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: place, error } = await ctx.supabase
        .from("businesses")
        .insert({
          name: input.name,
          user_id: ctx.user.id,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return place;
    }),
  getForUser: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("businesses")
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
  update: protectedProcedure
    .input(
      z
        .object({
          id: z.uuid(),
          imagePath: z.string().nullable().optional(),
          imageUrl: z.url().nullable().optional(),
          name: z.string().min(1).max(32).optional(),
        })
        .superRefine((input, ctx) => {
          if (
            input.name === undefined &&
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
      const { data: existingBusiness, error: existingBusinessError } =
        await ctx.supabase
          .from("businesses")
          .select("id, image_path")
          .eq("id", input.id)
          .eq("user_id", ctx.user.id)
          .single();

      if (existingBusinessError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: existingBusinessError.message,
        });
      }

      const { data, error } = await ctx.supabase
        .from("businesses")
        .update({
          image_path: input.imagePath,
          image_url: input.imageUrl,
          name: input.name,
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

      const oldImagePath = existingBusiness.image_path;
      const nextImagePath = input.imagePath;
      const shouldDeleteOldLogo =
        input.imagePath !== undefined &&
        oldImagePath &&
        oldImagePath !== nextImagePath;

      if (shouldDeleteOldLogo) {
        const { error: deleteError } = await ctx.supabase.storage
          .from("business_logos")
          .remove([oldImagePath]);

        if (deleteError) {
          console.error("Failed to delete old business logo:", deleteError);
        }
      }

      return data;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        businessId: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from("businesses")
        .delete()
        .eq("id", input.businessId)
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
});
