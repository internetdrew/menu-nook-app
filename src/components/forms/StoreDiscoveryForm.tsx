import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { StoreRecord } from "@/types/store";
import { trpc } from "@/utils/trpc";
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
import { Textarea } from "../ui/textarea";
import { AnimatedSubmitButton } from "./AnimatedSubmitButton";
import RemainingCharacters from "./RemainingCharacters";

const SEO_TITLE_LIMIT = 60;
const SEO_DESCRIPTION_LIMIT = 160;
const SEO_TITLE_WARNING_THRESHOLD = 10;
const SEO_DESCRIPTION_WARNING_THRESHOLD = 20;

const formSchema = z.object({
  seoTitle: z
    .string()
    .max(SEO_TITLE_LIMIT, {
      message: `SEO title must be less than ${SEO_TITLE_LIMIT} characters long.`,
    })
    .optional(),
  seoDescription: z
    .string()
    .max(SEO_DESCRIPTION_LIMIT, {
      message: `SEO description must be less than ${SEO_DESCRIPTION_LIMIT} characters long.`,
    })
    .optional(),
});

interface StoreDiscoveryFormProps {
  store: StoreRecord;
  onSuccess: () => void;
}

export const StoreDiscoveryForm = ({
  store,
  onSuccess,
}: StoreDiscoveryFormProps) => {
  const updateStore = useMutation(trpc.store.update.mutationOptions());
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seoTitle: store.menu_seo_title ?? "",
      seoDescription: store.menu_seo_description ?? "",
    },
  });

  const hasUnsavedChanges = form.formState.isDirty;
  const seoTitleValue = form.watch("seoTitle");
  const seoDescriptionValue = form.watch("seoDescription");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateStore.mutateAsync(
        {
          id: store.id,
          seoTitle: values.seoTitle?.trim() ? values.seoTitle.trim() : null,
          seoDescription: values.seoDescription?.trim()
            ? values.seoDescription.trim()
            : null,
        },
        {
          onSuccess: async (updatedStore) => {
            queryClient.setQueryData(
              trpc.store.getForUser.queryKey(),
              updatedStore,
            );
            await queryClient.invalidateQueries({
              queryKey: trpc.store.getForUser.queryKey(),
            });
            await queryClient.invalidateQueries({
              queryKey: trpc.store.getPreview.queryKey(),
            });
            toast.success("Search appearance details updated.");
            onSuccess();
          },
          onError: (error) => {
            console.error("Failed to update search appearance details:", error);
            toast.error(
              "Failed to update search appearance details. Please try again.",
            );
          },
        },
      );
    } catch (error) {
      console.error("Failed to update discovery details:", error);
      toast.error("Failed to update discovery details. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="seoTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Search Result Title</FormLabel>
                <FormControl>
                  <Input
                    maxLength={SEO_TITLE_LIMIT}
                    className="placeholder:text-[13px]"
                    placeholder="Maria's Dominican Sweets | Cakes & Desserts in Chelsea, MA"
                    {...field}
                  />
                </FormControl>
                <div className="flex items-start justify-between gap-4">
                  <FormDescription>
                    Use your store name, what you sell, and where you're
                    located.
                  </FormDescription>
                  <RemainingCharacters
                    value={seoTitleValue}
                    limit={SEO_TITLE_LIMIT}
                    warningThreshold={SEO_TITLE_WARNING_THRESHOLD}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seoDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Search Result Description</FormLabel>
                <FormControl>
                  <Textarea
                    maxLength={SEO_DESCRIPTION_LIMIT}
                    className="h-20 resize-none placeholder:text-[13px]"
                    placeholder="View Maria's Dominican Sweets' food page for Dominican cakes, flan, and party desserts in Chelsea, MA. Pickup and local delivery available."
                    {...field}
                  />
                </FormControl>
                <div className="flex items-start justify-between gap-4">
                  <FormDescription>
                    Keep it short and specific so it reads well in search
                    results.
                  </FormDescription>
                  <RemainingCharacters
                    value={seoDescriptionValue}
                    limit={SEO_DESCRIPTION_LIMIT}
                    warningThreshold={SEO_DESCRIPTION_WARNING_THRESHOLD}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <AnimatedSubmitButton
              isSubmitting={form.formState.isSubmitting}
              disabled={!hasUnsavedChanges}
              idleLabel="Save"
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
