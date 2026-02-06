import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import QRCode from "qrcode";
import { generateQRFilePath } from "../utils/qrCode";
import { supabaseAdminClient } from "../supabase";

export const menuRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        businessId: z.uuid(),
        baseUrl: z.url(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, businessId, baseUrl } = input;

      const { data: menu, error: menuCreationError } = await ctx.supabase
        .from("menus")
        .insert({
          name,
          business_id: businessId,
        })
        .select()
        .single();

      if (menuCreationError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: menuCreationError.message,
        });
      }

      const qrCodeDataUrl = await QRCode.toDataURL(
        `${baseUrl}/menu/${menu.id}`,
        {
          width: 400,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        },
      );

      const base64Data = qrCodeDataUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      const filePath = generateQRFilePath(menu.id);

      const { error: qrUploadError } = await ctx.supabase.storage
        .from("qr_codes")
        .upload(filePath, buffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (qrUploadError) {
        await ctx.supabase.from("menus").delete().eq("id", menu.id);

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
        .insert({ menu_id: menu.id, public_url: publicUrl });

      if (insertError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to insert QR code record: ${insertError.message}`,
        });
      }

      return menu;
    }),
  getAllForBusiness: protectedProcedure
    .input(
      z.object({
        businessId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
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

      return data;
    }),
  update: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
        name: z.string().min(1).max(32),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { menuId, name } = input;

      const { data, error } = await ctx.supabase
        .from("menus")
        .update({ name })
        .eq("id", menuId)
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
  delete: protectedProcedure
    .input(
      z.object({
        menuId: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
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
  getById: publicProcedure
    .input(
      z.object({
        menuId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { menuId } = input;

      const { data: menu, error: menuError } = await supabaseAdminClient
        .from("menus")
        .select(
          `
          *,
          business:businesses(*)
        `,
        )
        .eq("id", menuId)
        .maybeSingle();

      if (menuError) {
        console.error("Error fetching menu:", menuError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch menu: ${menuError.message}`,
        });
      }

      if (!menu) {
        console.warn("Menu not found for ID:", menuId);
        return null;
      }

      const { data: sortedCategories, error: catError } = await ctx.supabase
        .from("menu_category_sort_indexes")
        .select(
          `
          *,
          category:menu_categories(*, 
            items:menu_category_items(
              *,
              sort_index:menu_category_item_sort_indexes(order_index)
            )
          )
        `,
        )
        .eq("menu_id", menuId)
        .order("order_index", { ascending: true });

      if (catError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch category sort order: ${catError.message}`,
        });
      }

      const categoriesWithSortedItems = sortedCategories.map((row) => {
        const items =
          row.category.items
            ?.map((item) => {
              const { sort_index, ...rest } = item;

              return {
                ...rest,
                order_index: sort_index?.[0]?.order_index ?? 0,
              };
            })
            .sort((a, b) => a.order_index - b.order_index) ?? [];

        return {
          ...row.category,
          items,
        };
      });

      return {
        ...menu,
        menu_categories: categoriesWithSortedItems,
      };
    }),
});
