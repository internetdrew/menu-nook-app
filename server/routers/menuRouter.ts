import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";
import QRCode from "qrcode";
import { generateQRFilePath } from "../utils/qrCode";

export const menuRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        businessId: z.uuid(),
        baseUrl: z.url(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, businessId, baseUrl } = input;

      const { data: menu, error: menuCreationError } = await supabaseAdminClient
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

      const { error: qrUploadError } = await supabaseAdminClient.storage
        .from("qr_codes")
        .upload(filePath, buffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (qrUploadError) {
        await supabaseAdminClient.from("menus").delete().eq("id", menu.id);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload QR code to storage: ${qrUploadError.message}`,
        });
      }

      const {
        data: { publicUrl },
      } = supabaseAdminClient.storage.from("qr_codes").getPublicUrl(filePath);

      const { error: insertError } = await supabaseAdminClient
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
        menuId: z.uuid(),
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
