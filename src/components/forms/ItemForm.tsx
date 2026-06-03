import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { supabaseBrowserClient } from "@/lib/supabase";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import {
  ITEM_DESCRIPTION_LIMIT,
  ITEM_NAME_LIMIT,
  ITEM_TAGLINE_LIMIT,
  menuItemFieldsSchema,
} from "../../../shared/menuItem";
import type { MenuPreviewCategory, MenuPreviewItem } from "@/types/menu";

interface ItemFormProps {
  onSuccess: () => void;
  item?: MenuPreviewItem | null;
  chosenCategory: MenuPreviewCategory | null;
}

const getRemainingCharacterLabel = (value: string | undefined, limit: number) =>
  `${Math.max(limit - (value?.length ?? 0), 0)} characters left`;

const formSchema = menuItemFieldsSchema.extend({
  categoryId: z.number(),
});

const MENU_ITEM_IMAGE_BUCKET = "menu_item_images";
const MAX_RAW_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_EDGE = 1600;
const COMPRESSED_IMAGE_TYPE = "image/webp";
const COMPRESSED_IMAGE_EXTENSION = "webp";
const COMPRESSED_IMAGE_QUALITY = 0.82;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_IMAGE_INPUT_TYPES = "image/jpeg,image/png,image/webp";

const formatBytesAsMb = (bytes: number) =>
  `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;

const getMenuItemImageFilePath = (
  menuId: string,
  itemId: number,
  file: File,
) => {
  const extension =
    file.type === COMPRESSED_IMAGE_TYPE
      ? COMPRESSED_IMAGE_EXTENSION
      : file.name.split(".").pop()?.toLowerCase() || "png";
  return `menu/${menuId}/item/${itemId}/image_${Date.now()}.${extension}`;
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
  const baseName = fileName.replace(/\.[^.]+$/, "") || "item-image";
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

const ItemForm = (props: ItemFormProps) => {
  const { onSuccess, item, chosenCategory } = props;
  const { activeMenu } = useMenuContext();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removedImage, setRemovedImage] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const createItem = useMutation(
    trpc.menuCategoryItem.create.mutationOptions(),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name ?? "",
      tagline: item?.tagline ?? "",
      description: item?.description ?? "",
      price: item?.price ?? 0,
      categoryId: chosenCategory?.id,
    },
  });
  const nameValue = form.watch("name");
  const taglineValue = form.watch("tagline");
  const descriptionValue = form.watch("description");

  const updateItem = useMutation(
    trpc.menuCategoryItem.update.mutationOptions(),
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = useCallback(() => {
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return null;
    });
  }, []);

  useEffect(() => {
    clearPreview();
    setSelectedImageFile(null);
    setRemovedImage(false);
    form.reset();
  }, [chosenCategory, form, item, clearPreview]);

  const displayedImageUrl =
    previewUrl || (removedImage ? null : item?.image_url);

  const uploadItemImage = async (targetItemId: number, file: File) => {
    const menuId = activeMenu?.id;

    if (!menuId) {
      throw new Error("No active menu found for this upload.");
    }

    const filePath = getMenuItemImageFilePath(menuId, targetItemId, file);
    const { error: uploadError } = await supabaseBrowserClient.storage
      .from(MENU_ITEM_IMAGE_BUCKET)
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
      .from(MENU_ITEM_IMAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      imagePath: filePath,
      imageUrl: publicUrl,
    };
  };

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessingImage(true);

    if (!chosenCategory) {
      setIsProcessingImage(false);
      return;
    }

    if (item) {
      try {
        const imagePayload = selectedImageFile
          ? await uploadItemImage(item.id, selectedImageFile)
          : removedImage
            ? { imagePath: null, imageUrl: null }
            : undefined;

        await updateItem.mutateAsync(
          {
            id: item.id,
            name: values.name,
            tagline: values.tagline,
            description: values.description,
            price: values.price,
            menuCategoryId: chosenCategory?.id,
            ...imagePayload,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.menuCategoryItem.getSortedForCategory.queryKey(),
              });
              queryClient.invalidateQueries({
                queryKey: trpc.menu.getPreview.queryKey(),
              });
              toast.success("Item updated successfully!");
              onSuccess();
            },
            onError: (error) => {
              console.error("Failed to update item:", error);
              toast.error("Failed to update item. Please try again.");
            },
          },
        );
      } finally {
        setIsProcessingImage(false);
      }

      return;
    }

    try {
      const createdItem = await createItem.mutateAsync({
        name: values.name,
        tagline: values.tagline,
        description: values.description,
        price: values.price,
        menuCategoryId: chosenCategory.id,
        menuId: activeMenu?.id || "",
      });

      if (selectedImageFile) {
        const imagePayload = await uploadItemImage(
          createdItem.id,
          selectedImageFile,
        );

        await updateItem.mutateAsync({
          id: createdItem.id,
          name: values.name,
          tagline: values.tagline,
          description: values.description,
          price: values.price,
          menuCategoryId: chosenCategory.id,
          ...imagePayload,
        });
      }

      queryClient.invalidateQueries({
        queryKey: trpc.menuCategoryItem.getSortedForCategory.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.menu.getPreview.queryKey(),
      });
      toast.success("Item created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error("Failed to create item. Please try again.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Field>
          <FieldLabel htmlFor={fileInputId}>Item Image</FieldLabel>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="bg-muted flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={openFilePicker}
              disabled={form.formState.isSubmitting || isProcessingImage}
              aria-label="Upload item image"
            >
              {displayedImageUrl ? (
                <img
                  src={displayedImageUrl}
                  alt={item?.name ? `${item.name} preview` : "Item preview"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground text-xs">No image</span>
              )}
            </button>
            <div className="flex flex-col gap-2">
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_INPUT_TYPES}
                className="sr-only"
                tabIndex={-1}
                onChange={handleImageSelected}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openFilePicker}
                disabled={form.formState.isSubmitting || isProcessingImage}
              >
                {displayedImageUrl ? "Replace image" : "Upload image"}
              </Button>
              {displayedImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={form.formState.isSubmitting || isProcessingImage}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
          <FieldDescription>
            Add one optional image for this item. You can replace or remove it
            later.
          </FieldDescription>
        </Field>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input
                  maxLength={ITEM_NAME_LIMIT}
                  placeholder="e.g. Drunk Man Noodles"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The item name as it will appear to customers.{" "}
                {getRemainingCharacterLabel(nameValue, ITEM_NAME_LIMIT)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Tagline</FormLabel>
              <FormControl>
                <Textarea
                  maxLength={ITEM_TAGLINE_LIMIT}
                  className="field-sizing-content resize-none"
                  placeholder="A short line customers see in the menu before opening the item."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A short optional teaser shown in the menu list.{" "}
                {getRemainingCharacterLabel(taglineValue, ITEM_TAGLINE_LIMIT)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Description</FormLabel>
              <FormControl>
                <Textarea
                  maxLength={ITEM_DESCRIPTION_LIMIT}
                  className="min-h-28 resize-y"
                  placeholder="A longer description customers see after they open the item."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A longer optional description revealed inside the item dialog.{" "}
                {getRemainingCharacterLabel(
                  descriptionValue,
                  ITEM_DESCRIPTION_LIMIT,
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                How much your item costs. Displayed to customers.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              form.formState.isSubmitting ||
              isProcessingImage ||
              (!form.formState.isDirty && !selectedImageFile && !removedImage)
            }
          >
            {item
              ? form.formState.isSubmitting || isProcessingImage
                ? "Updating..."
                : "Update"
              : form.formState.isSubmitting || isProcessingImage
                ? "Creating..."
                : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ItemForm;
