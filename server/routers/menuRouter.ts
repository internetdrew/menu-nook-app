import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const menuRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        businessId: z.uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data: place, error } = await supabaseAdminClient
        .from("menus")
        .insert({
          name: input.name,
          business_id: input.businessId,
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
  getAllForBusiness: protectedProcedure
    .input(
      z.object({
        businessId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdminClient
        .from("menus")
        .select()
        .eq("business_id", input.businessId);

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
        menuId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabaseAdminClient
        .from("menus")
        .delete()
        .eq("id", input.menuId)
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
