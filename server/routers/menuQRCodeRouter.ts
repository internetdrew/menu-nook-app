import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js";
import QRCode from "qrcode";
import type { MenuRow } from "../utils/menuTypes.js";
import { buildStableMenuPublicUrl } from "../utils/menuPublicUrl.js";

export const menuQRCodeRouter = router({
  getPublicUrlForMenu: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { menuId } = input;
      const { data: menu, error: menuError } = await ctx.supabase
        .from("menus")
        .select()
        .eq("id", menuId)
        .maybeSingle();

      if (menuError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch menu for QR code generation: ${menuError.message}`,
        });
      }

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found.",
        });
      }

      const { data: business, error: businessError } = await ctx.supabase
        .from("businesses")
        .select("id, user_id")
        .eq("id", menu.business_id)
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (businessError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to verify menu ownership: ${businessError.message}`,
        });
      }

      if (!business) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this menu.",
        });
      }

      const encodedUrl = buildStableMenuPublicUrl(menu as unknown as MenuRow);
      const publicUrl = await QRCode.toDataURL(encodedUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      return { public_url: publicUrl, encoded_url: encodedUrl };
    }),
});
