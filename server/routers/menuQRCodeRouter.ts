import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js";
import QRCode from "qrcode";
import type { MenuRow } from "../utils/menuTypes.js";

const PUBLIC_MENU_DOMAIN =
  process.env.VITE_PUBLIC_MENU_DOMAIN || "https://menunook.com";

const buildMenuPublicUrl = (menu: Pick<MenuRow, "id" | "slug">) =>
  `${PUBLIC_MENU_DOMAIN}/m/${menu.slug ?? menu.id}`;

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

      const publicUrl = await QRCode.toDataURL(
        buildMenuPublicUrl(menu as unknown as MenuRow),
        {
          width: 400,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        },
      );

      return { public_url: publicUrl };
    }),
});
