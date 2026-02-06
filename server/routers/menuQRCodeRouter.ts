import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";

export const menuQRCodeRouter = router({
  getPublicUrlForMenu: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { menuId } = input;
      const { data, error } = await ctx.supabase
        .from("menu_qr_codes")
        .select("public_url")
        .eq("menu_id", menuId)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch QR code by place ID: ${error.message}`,
        });
      }

      return data;
    }),
});
