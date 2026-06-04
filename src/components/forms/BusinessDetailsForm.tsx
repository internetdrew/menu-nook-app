import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpFromLine, Image as ImageIcon, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { ChangeEvent } from "react";
import type { BusinessRecord } from "@/types/menu";
import { supabaseBrowserClient } from "@/lib/supabase";
import { trpc } from "@/utils/trpc";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { AnimatedSubmitButton } from "./AnimatedSubmitButton";

const formSchema = z.object({
  name: z.string().min(1, "Business name is required.").max(32),
});

const BUSINESS_LOGO_BUCKET = "business_logos";
const MAX_RAW_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_EDGE = 1600;
const COMPRESSED_IMAGE_TYPE = "image/webp";
const COMPRESSED_IMAGE_EXTENSION = "webp";
const COMPRESSED_IMAGE_QUALITY = 0.82;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_IMAGE_INPUT_TYPES = "image/jpeg,image/png,image/webp";

const formatBytesAsMb = (bytes: number) =>
  `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;

const getBusinessLogoFilePath = (businessId: string, file: File) => {
  const extension =
    file.type === COMPRESSED_IMAGE_TYPE
      ? COMPRESSED_IMAGE_EXTENSION
      : file.name.split(".").pop()?.toLowerCase() || "png";

  return `business/${businessId}/logo/image_${Date.now()}.${extension}`;
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image."));
    };
    image.src = objectUrl;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress the selected image."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });

const getCompressedImageName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "business-logo";
  return `${baseName}.${COMPRESSED_IMAGE_EXTENSION}`;
};

const compressImageFile = async (file: File) => {
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_COMPRESSED_IMAGE_EDGE / Math.max(image.width, image.height),
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare the selected image.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(
    canvas,
    COMPRESSED_IMAGE_TYPE,
    COMPRESSED_IMAGE_QUALITY,
  );

  return new File([blob], getCompressedImageName(file.name), {
    type: COMPRESSED_IMAGE_TYPE,
    lastModified: Date.now(),
  });
};

interface BusinessDetailsFormProps {
  business: BusinessRecord;
  onSuccess: () => void;
}

export const BusinessDetailsForm = ({
  business,
  onSuccess,
}: BusinessDetailsFormProps) => {
  const updateBusiness = useMutation(trpc.business.update.mutationOptions());
  const queryClient = useQueryClient();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    business.image_url ?? null,
  );
  const [removedImage, setRemovedImage] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: business.name,
    },
  });

  const hasUnsavedChanges =
    form.formState.isDirty || selectedImageFile !== null || removedImage;

  useEffect(() => {
    if (selectedImageFile) {
      return;
    }

    setPreviewUrl(business.image_url ?? null);
    setRemovedImage(false);
  }, [business.image_url, selectedImageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = useCallback(() => {
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return null;
    });
  }, []);

  const openFilePicker = () => {
    if (form.formState.isSubmitting || isProcessingImage) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      toast.error("Please choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_RAW_IMAGE_BYTES) {
      toast.error(
        `Please choose an image smaller than ${formatBytesAsMb(
          MAX_RAW_IMAGE_BYTES,
        )}.`,
      );
      return;
    }

    setIsProcessingImage(true);

    try {
      const compressedFile = await compressImageFile(file);

      clearPreview();
      setSelectedImageFile(compressedFile);
      setRemovedImage(false);
      setPreviewUrl(URL.createObjectURL(compressedFile));

      if (compressedFile.size < file.size) {
        toast.success(
          `Image optimized from ${formatBytesAsMb(
            file.size,
          )} to ${formatBytesAsMb(compressedFile.size)}.`,
        );
      }
    } catch (error) {
      console.error("Failed to process selected image:", error);
      toast.error("Failed to process that image. Please try another file.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    clearPreview();
    setSelectedImageFile(null);
    setRemovedImage(true);
  };

  const uploadBusinessLogo = async (file: File) => {
    const filePath = getBusinessLogoFilePath(business.id, file);
    const { error: uploadError } = await supabaseBrowserClient.storage
      .from(BUSINESS_LOGO_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabaseBrowserClient.storage
      .from(BUSINESS_LOGO_BUCKET)
      .getPublicUrl(filePath);

    return {
      imagePath: filePath,
      imageUrl: publicUrl,
    };
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessingImage(true);

    try {
      const logoPayload = selectedImageFile
        ? await uploadBusinessLogo(selectedImageFile)
        : removedImage
          ? { imagePath: null, imageUrl: null }
          : undefined;

      await updateBusiness.mutateAsync(
        {
          id: business.id,
          name: values.name,
          ...logoPayload,
        },
        {
          onSuccess: async (updatedBusiness) => {
            queryClient.setQueryData(
              trpc.business.getForUser.queryKey(),
              updatedBusiness,
            );
            await queryClient.invalidateQueries({
              queryKey: trpc.business.getForUser.queryKey(),
            });
            await queryClient.invalidateQueries({
              queryKey: trpc.menu.getPreview.queryKey(),
            });
            toast.success("Business profile updated.");
            onSuccess();
          },
          onError: (error) => {
            console.error("Failed to update business:", error);
            toast.error("Failed to update business. Please try again.");
          },
        },
      );
    } catch (error) {
      console.error("Failed to update business logo:", error);
      toast.error("Failed to update business. Please try again.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="The Blonde Wolf" {...field} />
                </FormControl>
                <FormDescription>
                  This is the business name customers see on your menu.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Field>
            <FieldLabel htmlFor={fileInputId}>Business Logo</FieldLabel>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={openFilePicker}
                disabled={form.formState.isSubmitting || isProcessingImage}
                aria-label="Upload business logo"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`${business.name} logo preview`}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="text-muted-foreground size-5" />
                )}
              </button>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_INPUT_TYPES}
                  className="sr-only"
                  tabIndex={-1}
                  onChange={handleImageSelected}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openFilePicker}
                    disabled={form.formState.isSubmitting || isProcessingImage}
                  >
                    <ArrowUpFromLine className="size-4" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={
                      form.formState.isSubmitting ||
                      isProcessingImage ||
                      (!previewUrl && !business.image_url)
                    }
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
                <FieldDescription className="text-xs">
                  Displayed on the public menu. JPEG, PNG, or WebP up to 25MB.
                </FieldDescription>
              </div>
            </div>
          </Field>

          <div className="flex justify-end">
            <AnimatedSubmitButton
              isSubmitting={form.formState.isSubmitting || isProcessingImage}
              disabled={!hasUnsavedChanges}
              idleLabel="Save"
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
