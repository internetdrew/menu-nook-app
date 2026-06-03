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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { MenuRecord } from "@/types/menu";

const formSchema = z.object({
  name: z.string().min(1, "Menu name is required.").max(32),
});

interface MenuSettingsFormProps {
  menu: MenuRecord;
  onSuccess: (menu: MenuRecord) => void;
}

export const MenuSettingsForm = ({
  menu,
  onSuccess,
}: MenuSettingsFormProps) => {
  const updateMenu = useMutation(trpc.menu.update.mutationOptions());
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: menu.name,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await updateMenu.mutateAsync(
      {
        menuId: menu.id,
        name: values.name,
      },
      {
        onSuccess: async (updatedMenu) => {
          await queryClient.invalidateQueries({
            queryKey: trpc.menu.getAllForBusiness.queryKey(),
          });
          await queryClient.invalidateQueries({
            queryKey: trpc.menu.getPreview.queryKey(),
          });
          toast.success("Menu settings updated.");
          onSuccess(updatedMenu);
        },
        onError: (error) => {
          console.error("Failed to update menu:", error);
          toast.error("Failed to update menu. Please try again.");
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
                <Input placeholder="Dinner Menu" {...field} />
              </FormControl>
              <FormDescription>
                Use this to distinguish between multiple menus.
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
