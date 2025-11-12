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
import { useRestaurantContext } from "@/contexts/ActiveRestaurantContext";

const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "Please add a category name.",
    })
    .max(100, {
      message: "Category name must be less than 100 characters long.",
    }),
  description: z
    .string()
    .max(255, {
      message: "Description must less than 255 characters long.",
    })
    .optional(),
});

const CreateCategoryForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const createCategory = useMutation(trpc.category.create.mutationOptions());
  const { activeRestaurant } = useRestaurantContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createCategory.mutateAsync(
      { restaurantId: activeRestaurant?.id ?? "", ...values },
      {
        onError: (error) => {
          console.error("Failed to create category:", error);
          toast.error("Failed to create category. Please try again.");
        },
      },
    );

    await queryClient.invalidateQueries({
      queryKey: trpc.category.getAllByRestaurant.queryKey(),
    });
    toast.success("Category created successfully!");
    onSuccess();
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
                  placeholder="e.g. Appetizers, Main Courses, Desserts"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Once created, you can add menu items to this category.
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
              <FormLabel>Category Description</FormLabel>
              <FormControl>
                <Textarea
                  className="field-sizing-content resize-none"
                  placeholder="A brief description of this category."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can provide additional details about this category
                (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateCategoryForm;
