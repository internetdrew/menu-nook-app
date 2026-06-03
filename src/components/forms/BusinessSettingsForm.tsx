import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useMutation } from "@tanstack/react-query";
import { queryClient, trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { BusinessRecord } from "@/types/menu";

const formSchema = z.object({
  name: z.string().min(1, "Business name is required.").max(32),
});

interface BusinessSettingsFormProps {
  business: BusinessRecord;
  onSuccess: () => void;
}

export const BusinessSettingsForm = ({
  business,
  onSuccess,
}: BusinessSettingsFormProps) => {
  const updateBusiness = useMutation(trpc.business.update.mutationOptions());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: business.name,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await updateBusiness.mutateAsync(
      {
        id: business.id,
        name: values.name,
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
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
        <div className="flex justify-end">
          <AnimatedSubmitButton
            isSubmitting={form.formState.isSubmitting}
            idleLabel="Save"
          />
        </div>
      </form>
    </Form>
  );
};
