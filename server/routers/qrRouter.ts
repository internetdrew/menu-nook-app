import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";
import QRCode from "qrcode";
import { generateQRFilePath } from "../utils/generateQRFilePath";

export const qrCodeRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        placeId: z.uuid(),
        baseUrl: z.url(),
      }),
    )
    .mutation(async ({ input }) => {
      const { baseUrl, placeId } = input;

      const qrCodeDataUrl = await QRCode.toDataURL(
        `${baseUrl}/menu/${placeId}`,
        {
          width: 400,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        },
      );

      const base64Data = qrCodeDataUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      const filePath = generateQRFilePath(placeId);

      const { data: uploadData, error: uploadError } =
        await supabaseAdminClient.storage
          .from("qr_codes")
          .upload(filePath, buffer, {
            contentType: "image/png",
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload QR code to storage: ${uploadError.message}`,
        });
      }

      const {
        data: { publicUrl },
      } = supabaseAdminClient.storage.from("qr_codes").getPublicUrl(filePath);

      const { error: insertError } = await supabaseAdminClient
        .from("qr_codes")
        .insert({ place_id: placeId, public_url: publicUrl });

      if (insertError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to insert QR code record: ${insertError.message}`,
        });
      }

      return uploadData;
    }),
});
