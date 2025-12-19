import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const businessRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: place, error } = await supabaseAdminClient
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
    const { data, error } = await supabaseAdminClient
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
  delete: protectedProcedure
    .input(
      z.object({
        businessId: z.uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabaseAdminClient
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
