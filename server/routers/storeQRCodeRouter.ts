import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js";
import QRCode from "qrcode";
import { buildStorePublicUrl } from "../utils/storePublicUrl.js";
import type { StoreRow } from "../utils/storeTypes.js";

export const storeQRCodeRouter = router({
  getPublicUrlForStore: protectedProcedure
    .input(
      z.object({
        storeId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { storeId } = input;
      const { data: store, error: storeError } = await ctx.supabase
        .from("stores")
        .select()
        .eq("id", storeId)
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (storeError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch store for QR code generation: ${storeError.message}`,
        });
      }

      if (!store) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Store not found.",
        });
      }

      const encodedUrl = buildStorePublicUrl(store as StoreRow);
      const publicUrl = await QRCode.toDataURL(encodedUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      return { public_url: publicUrl, encoded_url: encodedUrl };
    }),
});
