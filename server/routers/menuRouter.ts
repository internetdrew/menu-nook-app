import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import QRCode from "qrcode";
import { generateQRFilePath } from "../utils/qrCode.js";
import { supabaseAdminClient } from "../supabase.js";
import { fetchMenuWithCategories } from "../utils/fetchMenuWithCategories.js";
import type { MenuRow } from "../utils/menuTypes.js";
import type { BusinessRow } from "../utils/menuTypes.js";
import type { MenuInsert } from "../utils/menuTypes.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.js";
import {
  checkMenuSlugAvailability,
  isMenuSlugUniqueViolation,
  resolveUniqueMenuSlug,
} from "../utils/menuSlug.js";
import { menuSlugSchema } from "../../shared/menuSlug.js";
import { buildStableMenuPublicUrl } from "../utils/menuPublicUrl.js";

const getOwnedBusiness = async (
  supabase: SupabaseClient<Database>,
  businessId: string,
  userId: string,
) => {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, user_id, name")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  if (!data || data.user_id !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this business.",
    });
  }

  return data as BusinessRow;
};

const getOwnedMenu = async (
  supabase: SupabaseClient<Database>,
  menuId: string,
  userId: string,
) => {
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .select()
    .eq("id", menuId)
    .maybeSingle();

  if (menuError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: menuError.message,
    });
  }

  if (!menu) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Menu not found.",
    });
  }

  const ownedBusiness = await getOwnedBusiness(supabase, menu.business_id, userId);

  return {
    ...(menu as unknown as MenuRow),
    business: ownedBusiness,
  };
};

export const menuRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        businessId: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, businessId } = input;
      await getOwnedBusiness(ctx.supabase, businessId, ctx.user.id);

      const slugBase = name;
      let slug = await resolveUniqueMenuSlug(supabaseAdminClient, slugBase);
      let insertedMenu: MenuRow | null = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { data: menu, error: menuCreationError } = await ctx.supabase
          .from("menus")
          .insert({
            name,
            business_id: businessId,
            slug,
          } satisfies MenuInsert)
          .select()
          .single();

        if (!menuCreationError) {
          insertedMenu = menu as MenuRow;
          break;
        }

        if (!isMenuSlugUniqueViolation(menuCreationError)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: menuCreationError.message,
          });
        }

        slug = await resolveUniqueMenuSlug(supabaseAdminClient, slugBase);
      }

      if (!insertedMenu) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create a unique menu link.",
        });
      }

      const encodedUrl = buildStableMenuPublicUrl(insertedMenu);
      const qrCodeDataUrl = await QRCode.toDataURL(encodedUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      const base64Data = qrCodeDataUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      const filePath = generateQRFilePath(insertedMenu.id);

      const { error: qrUploadError } = await ctx.supabase.storage
        .from("qr_codes")
        .upload(filePath, buffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (qrUploadError) {
        await ctx.supabase.from("menus").delete().eq("id", insertedMenu.id);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload QR code to storage: ${qrUploadError.message}`,
        });
      }

      const {
        data: { publicUrl },
      } = ctx.supabase.storage.from("qr_codes").getPublicUrl(filePath);

      const { error: insertError } = await ctx.supabase
        .from("menu_qr_codes")
        .insert({
          menu_id: insertedMenu.id,
          public_url: publicUrl,
          encoded_url: encodedUrl,
        });

      if (insertError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to insert QR code record: ${insertError.message}`,
        });
      }

      return insertedMenu;
    }),
  getAllForBusiness: protectedProcedure
    .input(
      z.object({
        businessId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await getOwnedBusiness(ctx.supabase, input.businessId, ctx.user.id);

      const { data, error } = await ctx.supabase
        .from("menus")
        .select()
        .eq("business_id", input.businessId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data as MenuRow[];
    }),
  update: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
        name: z.string().min(1).max(32),
        slug: menuSlugSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { menuId, name, slug } = input;
      await getOwnedMenu(ctx.supabase, menuId, ctx.user.id);

      const availability = await checkMenuSlugAvailability(
        supabaseAdminClient,
        slug,
        {
          excludeMenuId: menuId,
        },
      );

      if (!availability.available) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: availability.message,
        });
      }

      const { data, error } = await ctx.supabase.rpc("update_menu_settings", {
        p_menu_id: menuId,
        p_name: name,
        p_slug: slug,
      });

      if (error) {
        if (
          isMenuSlugUniqueViolation(error) ||
          error.message === "That link is already taken."
        ) {
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

      return data as MenuRow;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ownedMenu = await getOwnedMenu(ctx.supabase, input.menuId, ctx.user.id);

      const { data, error } = await ctx.supabase
        .from("menus")
        .delete()
        .eq("id", input.menuId)
        .eq("business_id", ownedMenu.business_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data as MenuRow;
    }),
  checkSlugAvailability: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
        slug: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await getOwnedMenu(ctx.supabase, input.menuId, ctx.user.id);

      return checkMenuSlugAvailability(supabaseAdminClient, input.slug, {
        excludeMenuId: input.menuId,
      });
    }),
  getPreview: protectedProcedure
    .input(z.object({ menuId: z.uuid() }))
    .query(async ({ input, ctx }) => {
      await getOwnedMenu(ctx.supabase, input.menuId, ctx.user.id);

      return fetchMenuWithCategories(ctx.supabase, input.menuId);
    }),
  getPublic: publicProcedure
    .input(z.object({ menuId: z.uuid() }))
    .query(async ({ input }) => {
      return fetchMenuWithCategories(supabaseAdminClient, input.menuId);
    }),
});
