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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useStoreContext } from "@/contexts/StoreContext";
import type { StoreCategoryRecord } from "@/types/store";
import {
  CATEGORY_DESCRIPTION_LIMIT,
  CATEGORY_DESCRIPTION_WARNING_THRESHOLD,
  CATEGORY_NAME_LIMIT,
  CATEGORY_NAME_WARNING_THRESHOLD,
  storeCategoryFieldsSchema,
} from "../../../shared/storeCategory";
import RemainingCharacters from "./RemainingCharacters";

interface CategoryFormProps {
  onSuccess: () => void;
  category?: StoreCategoryRecord | null;
}

const formSchema = storeCategoryFieldsSchema;

const CategoryForm = ({ onSuccess, category }: CategoryFormProps) => {
  const createCategory = useMutation(
    trpc.storeCategory.create.mutationOptions(),
  );
  const updateCategory = useMutation(
    trpc.storeCategory.update.mutationOptions(),
  );
  const queryClient = useQueryClient();
  const { storeId } = useStoreContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
    },
  });
  const nameValue = form.watch("name");
  const descriptionValue = form.watch("description");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (category) {
      await updateCategory.mutateAsync(
        { categoryId: category.id, ...values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: trpc.storeCategory.getAllSortedByIndex.queryKey(),
            });
            if (storeId) {
              queryClient.invalidateQueries({
                queryKey: trpc.store.getPreview.queryKey({
                  storeId,
                }),
              });
            }
            toast.success("Category updated successfully!");
            onSuccess();
          },
          onError: (error) => {
            console.error("Failed to update category:", error);
            toast.error("Failed to update category. Please try again.");
          },
        },
      );
    } else {
      await createCategory.mutateAsync(
        { storeId: storeId ?? "", ...values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: trpc.storeCategory.getAllSortedByIndex.queryKey(),
            });
            if (storeId) {
              queryClient.invalidateQueries({
                queryKey: trpc.store.getPreview.queryKey({
                  storeId,
                }),
              });
            }
            toast.success("Category created successfully!");
            onSuccess();
          },
          onError: (error) => {
            console.error("Failed to create category:", error);
            toast.error("Failed to create category. Please try again.");
          },
        },
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input
                  maxLength={CATEGORY_NAME_LIMIT}
                  placeholder="e.g. Appetizers, Main Courses, Desserts"
                  {...field}
                />
              </FormControl>
              <div className="flex items-start justify-between gap-4">
                <FormDescription>
                  {category
                    ? "Update the name of this category."
                    : "Once created, you can add items to this category."}
                </FormDescription>
                <RemainingCharacters
                  value={nameValue}
                  limit={CATEGORY_NAME_LIMIT}
                  warningThreshold={CATEGORY_NAME_WARNING_THRESHOLD}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Description</FormLabel>
              <FormControl>
                <Textarea
                  maxLength={CATEGORY_DESCRIPTION_LIMIT}
                  className="h-20 resize-none"
                  placeholder="A brief description of this category."
                  {...field}
                />
              </FormControl>
              <div className="flex items-start justify-between gap-4">
                <FormDescription>
                  Optional context customers see near this category.
                </FormDescription>
                <RemainingCharacters
                  value={descriptionValue}
                  limit={CATEGORY_DESCRIPTION_LIMIT}
                  warningThreshold={CATEGORY_DESCRIPTION_WARNING_THRESHOLD}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            {form.formState.isSubmitting
              ? category
                ? "Updating..."
                : "Creating..."
              : category
                ? "Update"
                : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
