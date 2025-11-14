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
        .from("place_categories")
        .insert({
          place_id: placeId,
          name,
          description,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create category: ${error.message}`,
        });
      }

      return data;
    }),
  getAllByPlace: protectedProcedure
    .input(
      z.object({
        placeId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { placeId } = input;
      const { data, error } = await supabaseAdminClient
        .from("place_categories")
        .select("*, items:place_items(*)")
        .eq("place_id", placeId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch categories: ${error.message}`,
        });
      }

      return data;
    }),
});
