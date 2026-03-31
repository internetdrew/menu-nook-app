import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { supabaseBrowserClient } from "@/lib/supabase";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

type BusinessLogoUploadProps = {
  business: {
    id: string;
    image_path: string | null;
    image_url: string | null;
    name: string;
  };
};

const getBusinessLogoFilePath = (businessId: string, file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  return `business/${businessId}/logo_${Date.now()}.${extension}`;
};

export const BusinessLogoUpload = ({ business }: BusinessLogoUploadProps) => {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const updateBusiness = useMutation(trpc.business.update.mutationOptions());

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayedLogo = previewUrl || business?.image_url || undefined;

  const openFilePicker = () => {
    if (isUpdatingLogo) return;
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const persistLogo = async (
    imageUrl: string | null,
    imagePath: string | null,
  ) => {
    await updateBusiness.mutateAsync({
      id: business.id,
      imagePath,
      imageUrl,
    });

    await queryClient.invalidateQueries({
      queryKey: trpc.business.getForUser.queryKey(),
    });
  };

  const handleLogoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    clearPreview();
    setPreviewUrl(objectUrl);
    setIsUpdatingLogo(true);

    try {
      const filePath = getBusinessLogoFilePath(business.id, file);
      const { error: uploadError } = await supabaseBrowserClient.storage
        .from("business_logos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabaseBrowserClient.storage
        .from("business_logos")
        .getPublicUrl(filePath);

      await persistLogo(publicUrl, filePath);
      clearPreview();
      toast.success("Business logo updated successfully!");
    } catch (error) {
      console.error("Failed to upload business logo:", error);
      clearPreview();
      toast.error("Failed to upload business logo. Please try again.");
    } finally {
      setIsUpdatingLogo(false);
      event.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    clearPreview();

    if (!business.image_url) {
      return;
    }

    setIsUpdatingLogo(true);

    try {
      await persistLogo(null, null);
      toast.success("Business logo removed successfully!");
    } catch (error) {
      console.error("Failed to remove business logo:", error);
      toast.error("Failed to remove business logo. Please try again.");
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  return (
    <Field>
      <FieldLabel htmlFor={fileInputId}>Business Logo</FieldLabel>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-full transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={openFilePicker}
          disabled={isUpdatingLogo}
          aria-label="Upload business logo"
        >
          <Avatar className="size-20 border">
            <AvatarImage
              src={displayedLogo}
              alt={business?.name}
              className="object-cover"
            />
            <AvatarFallback className="text-sm font-medium">
              Logo
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex flex-col gap-2">
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={handleLogoSelected}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFilePicker}
            disabled={isUpdatingLogo}
          >
            {isUpdatingLogo ? "Uploading..." : "Upload logo"}
          </Button>
          {(business.image_url || previewUrl) && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={isUpdatingLogo}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </Field>
  );
};
