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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

export const CreateBusinessForm = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  const createBusiness = useMutation(trpc.business.create.mutationOptions());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createBusiness.mutateAsync(
      { ...values },
      {
        onError: (error) => {
          console.error("Failed to create business:", error);
          toast.error("Failed to create business. Please try again.");
        },
        onSuccess: async (business) => {
          await queryClient.invalidateQueries({
            queryKey: trpc.business.getForUser.queryKey(),
          });
          toast.success(`${business.name} created successfully!`);
          onSuccess();
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="The Blonde Wolf" {...field} />
              </FormControl>
              <FormDescription>
                Make sure this is the name your customers will recognize.
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
