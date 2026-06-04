import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { BusinessRecord } from "@/types/menu";
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

const SEO_TITLE_LIMIT = 60;
const SEO_DESCRIPTION_LIMIT = 160;
const SEO_TITLE_WARNING_THRESHOLD = 10;
const SEO_DESCRIPTION_WARNING_THRESHOLD = 20;

const getRemainingCharacterLabel = (value: string | undefined, limit: number) =>
  `${Math.max(limit - (value?.length ?? 0), 0)} characters left.`;

const getRemainingCharacterClassName = (
  value: string | undefined,
  limit: number,
  warningThreshold: number,
) => {
  const remaining = Math.max(limit - (value?.length ?? 0), 0);

  return remaining <= warningThreshold ? "text-destructive" : "";
};

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

interface BusinessDiscoveryFormProps {
  business: BusinessRecord;
  onSuccess: () => void;
}

export const BusinessDiscoveryForm = ({
  business,
  onSuccess,
}: BusinessDiscoveryFormProps) => {
  const updateBusiness = useMutation(trpc.business.update.mutationOptions());
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seoTitle: business.seo_title ?? "",
      seoDescription: business.seo_description ?? "",
    },
  });

  const hasUnsavedChanges = form.formState.isDirty;
  const seoTitleValue = form.watch("seoTitle");
  const seoDescriptionValue = form.watch("seoDescription");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateBusiness.mutateAsync(
        {
          id: business.id,
          seoTitle: values.seoTitle?.trim() ? values.seoTitle.trim() : null,
          seoDescription: values.seoDescription?.trim()
            ? values.seoDescription.trim()
            : null,
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
                    placeholder="Example: Maria's Dominican Sweets | Cakes & Desserts in Chelsea, MA"
                    {...field}
                  />
                </FormControl>
                <FormDescription
                  className={getRemainingCharacterClassName(
                    seoTitleValue,
                    SEO_TITLE_LIMIT,
                    SEO_TITLE_WARNING_THRESHOLD,
                  )}
                >
                  This is the main link people may see in Google. Use your
                  business name, what you sell, and where you're located.{" "}
                  {getRemainingCharacterLabel(seoTitleValue, SEO_TITLE_LIMIT)}
                </FormDescription>
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
                    placeholder="Example: View Maria's Dominican Sweets' menu for Dominican cakes, flan, and party desserts in Chelsea, MA. Pickup and local delivery available."
                    {...field}
                  />
                </FormControl>
                <FormDescription
                  className={getRemainingCharacterClassName(
                    seoDescriptionValue,
                    SEO_DESCRIPTION_LIMIT,
                    SEO_DESCRIPTION_WARNING_THRESHOLD,
                  )}
                >
                  This short description helps customers know what they'll find
                  on your menu before they click.
                  {getRemainingCharacterLabel(
                    seoDescriptionValue,
                    SEO_DESCRIPTION_LIMIT,
                  )}
                </FormDescription>
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
