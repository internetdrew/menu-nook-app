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
import { Input } from "../ui/input";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatedSubmitButton } from "./AnimatedSubmitButton";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Menu name must have at least 2 characters.",
  }),
});

export const CreateMenuForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const createMenu = useMutation(trpc.menu.create.mutationOptions());
  const queryClient = useQueryClient();
  const { data: business } = useQuery(trpc.business.getForUser.queryOptions());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!business) {
      toast.error("No business found. Please create a business first.");
      return;
    }

    await createMenu.mutateAsync(
      { ...values, businessId: business.id, baseUrl: window.location.origin },
      {
        onError: (error) => {
          console.error("Failed to add menu:", error);
          toast.error("Failed to add menu. Please try again.");
        },
        onSuccess: async (menu) => {
          toast.success(`${menu.name} added successfully!`);
          onSuccess();
          await queryClient.invalidateQueries({
            queryKey: trpc.menu.getAllForBusiness.queryKey(),
          });
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
              <FormLabel>Menu Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g. Dinner Menu" {...field} />
              </FormControl>
              <FormDescription>
                This will allow you to discern between multiple menus.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <AnimatedSubmitButton
            isSubmitting={form.formState.isSubmitting}
            idleLabel="Create"
          />
        </div>
      </form>
    </Form>
  );
};
