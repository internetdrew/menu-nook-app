import { useFieldArray, useForm } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { supabaseBrowserClient } from "@/lib/supabase";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { XIcon } from "lucide-react";
import {
  ITEM_DETAILS_LIMIT,
  ITEM_DETAIL_KEY_LIMIT,
  ITEM_DETAIL_VALUE_LIMIT,
  ITEM_DESCRIPTION_LIMIT,
  ITEM_NAME_LIMIT,
  ITEM_PRIMARY_TAG_LIMIT,
  ITEM_TAG_LIMIT,
  ITEM_TAGS_LIMIT,
  ITEM_TAGLINE_LIMIT,
  menuItemFieldsSchema,
  normalizeMenuItemDetails,
  normalizeMenuItemTags,
} from "../../../shared/menuItem";
import type { MenuCategoryRecord, MenuItemWithCategory } from "@/types/menu";

interface ItemFormProps {
  onSuccess: () => void;
  item?: MenuItemWithCategory | null;
  chosenCategory: MenuCategoryRecord;
}

const getRemainingCharacterLabel = (value: string | undefined, limit: number) =>
  `${Math.max(limit - (value?.length ?? 0), 0)} characters left`;

const formSchema = menuItemFieldsSchema.extend({
  categoryId: z.number(),
});

const getInitialTags = (item?: MenuItemWithCategory | null) =>
  item?.tags?.length ? item.tags : [];

const getInitialDetails = (item?: MenuItemWithCategory | null) =>
  normalizeMenuItemDetails(item?.details);

const getDefaultValues = (
  item: MenuItemWithCategory | null | undefined,
  chosenCategory: MenuCategoryRecord,
): z.infer<typeof formSchema> => ({
  name: item?.name ?? "",
  primaryTag: item?.primary_tag ?? "",
  tags: getInitialTags(item),
  tagline: item?.tagline ?? "",
  description: item?.description ?? "",
  details: getInitialDetails(item),
  price: item?.price ?? 0,
  categoryId: item?.category?.id ?? chosenCategory.id,
});

const MENU_ITEM_IMAGE_BUCKET = "menu_item_images";

const getMenuItemImageFilePath = (
  menuId: string,
  itemId: number,
  file: File,
) => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  return `menu/${menuId}/item/${itemId}/image_${Date.now()}.${extension}`;
};

const ItemForm = (props: ItemFormProps) => {
  const { onSuccess, item, chosenCategory } = props;
  const createItem = useMutation(
    trpc.menuCategoryItem.create.mutationOptions(),
  );
  const { activeMenu } = useMenuContext();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removedImage, setRemovedImage] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [pendingTagValue, setPendingTagValue] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(item, chosenCategory),
  });
  const detailFields = useFieldArray({
    control: form.control,
    name: "details",
  });
  const nameValue = form.watch("name");
  const primaryTagValue = form.watch("primaryTag");
  const tagsValue = form.watch("tags");
  const taglineValue = form.watch("tagline");
  const descriptionValue = form.watch("description");
  const detailsValue = form.watch("details");

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
    setPendingTagValue("");
    form.reset(getDefaultValues(item, chosenCategory));
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

  const handleImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }

    clearPreview();
    setSelectedImageFile(file);
    setRemovedImage(false);
    setPreviewUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleRemoveImage = () => {
    clearPreview();
    setSelectedImageFile(null);
    setRemovedImage(true);
  };

  const handleAddTag = () => {
    const normalizedTag = pendingTagValue.trim();

    if (!normalizedTag || (tagsValue?.length ?? 0) >= ITEM_TAGS_LIMIT) {
      return;
    }

    form.setValue("tags", [...(tagsValue ?? []), normalizedTag], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setPendingTagValue("");
  };

  const handleRemoveTag = (index: number) => {
    const nextTags = [...(tagsValue ?? [])];
    nextTags.splice(index, 1);
    form.setValue("tags", nextTags, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handlePendingTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleAddTag();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessingImage(true);
    const normalizedTags = normalizeMenuItemTags(values.tags);
    const normalizedDetails = normalizeMenuItemDetails(values.details);

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
            primaryTag: values.primaryTag,
            tags: normalizedTags,
            tagline: values.tagline,
            description: values.description,
            details: normalizedDetails,
            price: values.price,
            menuCategoryId: chosenCategory?.id,
            ...imagePayload,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.menuCategoryItem.getSortedForCategory.queryKey(),
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
        primaryTag: values.primaryTag,
        tags: normalizedTags,
        tagline: values.tagline,
        description: values.description,
        details: normalizedDetails,
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
          primaryTag: values.primaryTag,
          tags: normalizedTags,
          tagline: values.tagline,
          description: values.description,
          details: normalizedDetails,
          price: values.price,
          menuCategoryId: chosenCategory.id,
          ...imagePayload,
        });
      }

      queryClient.invalidateQueries({
        queryKey: trpc.menuCategoryItem.getSortedForCategory.queryKey(),
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
                accept="image/*"
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
          name="primaryTag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Tag</FormLabel>
              <FormControl>
                <Input
                  maxLength={ITEM_PRIMARY_TAG_LIMIT}
                  placeholder="e.g. Special"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                An optional short label shown next to the item name in the menu
                list. Add your tags then hit the update button below.{" "}
                {getRemainingCharacterLabel(
                  primaryTagValue,
                  ITEM_PRIMARY_TAG_LIMIT,
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Item Tags</FormLabel>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Input
                        maxLength={ITEM_TAG_LIMIT}
                        value={pendingTagValue}
                        placeholder="e.g. Gluten-Free"
                        onChange={(event) =>
                          setPendingTagValue(event.target.value)
                        }
                        onKeyDown={handlePendingTagKeyDown}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-0.5"
                      onClick={handleAddTag}
                      disabled={(tagsValue?.length ?? 0) >= ITEM_TAGS_LIMIT}
                    >
                      Add tag
                    </Button>
                  </div>
                  <FormDescription>
                    Optional short labels shown in the item dialog.{" "}
                    {getRemainingCharacterLabel(
                      pendingTagValue,
                      ITEM_TAG_LIMIT,
                    )}
                    .
                  </FormDescription>
                </div>
                {tagsValue && tagsValue.length > 0 && (
                  <div
                    className="flex flex-wrap gap-2"
                    aria-label="Added item tags"
                  >
                    {tagsValue.map((tag, index) => (
                      <Badge
                        key={`${tag}-${index}`}
                        variant="outline"
                        className="gap-1 py-1 pr-1 pl-3"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          className="hover:bg-accent rounded-full p-0.5 transition-colors"
                          aria-label={`Remove tag ${tag}`}
                          onClick={() => handleRemoveTag(index)}
                        >
                          <XIcon className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-muted-foreground text-sm">
                  {Math.max(ITEM_TAGS_LIMIT - (tagsValue?.length ?? 0), 0)}{" "}
                  {Math.max(ITEM_TAGS_LIMIT - (tagsValue?.length ?? 0), 0) === 1
                    ? "tag"
                    : "tags"}{" "}
                  left to add
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <FieldLabel>Item Details</FieldLabel>
              <FieldDescription>
                Optional key/value cards shown in the item dialog.
              </FieldDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => detailFields.append({ key: "", value: "" })}
              disabled={(detailsValue?.length ?? 0) >= ITEM_DETAILS_LIMIT}
            >
              Add detail
            </Button>
          </div>
          {detailFields.fields.length > 0 ? (
            <div className="space-y-4">
              {detailFields.fields.map((detailField, index) => (
                <div
                  key={detailField.id}
                  className="bg-muted/35 space-y-3 rounded-xl border p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-start">
                    <FormField
                      control={form.control}
                      name={`details.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{`Detail Label ${index + 1}`}</FormLabel>
                          <FormControl>
                            <Input
                              maxLength={ITEM_DETAIL_KEY_LIMIT}
                              placeholder="e.g. Calories"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {getRemainingCharacterLabel(
                              field.value,
                              ITEM_DETAIL_KEY_LIMIT,
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`details.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{`Detail Value ${index + 1}`}</FormLabel>
                          <FormControl>
                            <Input
                              maxLength={ITEM_DETAIL_VALUE_LIMIT}
                              placeholder="e.g. 450 kcal"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {getRemainingCharacterLabel(
                              field.value,
                              ITEM_DETAIL_VALUE_LIMIT,
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive mt-7"
                        onClick={() => detailFields.remove(index)}
                        aria-label={`Remove detail ${index + 1}`}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-muted-foreground text-sm">
                {Math.max(ITEM_DETAILS_LIMIT - detailFields.fields.length, 0)}{" "}
                {Math.max(ITEM_DETAILS_LIMIT - detailFields.fields.length, 0) ===
                1
                  ? "detail row"
                  : "detail rows"}{" "}
                left to add
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No detail rows added yet.
            </p>
          )}
        </div>
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
