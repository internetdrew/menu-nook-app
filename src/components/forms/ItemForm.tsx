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
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "server";
import { usePlaceContext } from "@/contexts/ActivePlaceContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { type Item } from "@/components/table-columns/getItemColumns";

type Categories = inferRouterOutputs<AppRouter>["category"]["getAllByPlace"];

interface ItemFormProps {
  onSuccess: () => void;
  categories: Categories;
  item?: Item | null;
}

const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "Please add an item name.",
    })
    .max(100, {
      message: "Item name must be less than 100 characters long.",
    }),
  description: z
    .string()
    .max(255, {
      message: "Description must less than 255 characters long.",
    })
    .optional(),
  price: z
    .number()
    .min(0, { message: "Price must be a positive number." })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
      message: "Price can have up to 2 decimal places.",
    }),
  categoryId: z.number(),
});

const ItemForm = (props: ItemFormProps) => {
  const { onSuccess, categories, item } = props;
  const createItem = useMutation(trpc.item.create.mutationOptions());
  const { activePlace } = usePlaceContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      price: item?.price ?? 0,
      categoryId: item?.category?.id ?? categories?.[0]?.id,
    },
  });

  const updateItem = useMutation(trpc.item.update.mutationOptions());

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (item) {
      await updateItem.mutateAsync(
        {
          id: item.id,
          name: values.name,
          description: values.description,
          price: values.price,
          categoryId: values.categoryId,
          placeId: activePlace?.id || "",
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: trpc.item.getAllByPlace.queryKey(),
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

      return;
    }

    await createItem.mutateAsync(
      {
        name: values.name,
        description: values.description,
        price: values.price,
        categoryId: values.categoryId,
        placeId: activePlace?.id || "",
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.item.getAllByPlace.queryKey(),
          });
          toast.success("Item created successfully!");
          onSuccess();
        },
        onError: (error) => {
          console.error("Failed to create item:", error);
          toast.error("Failed to create item. Please try again.");
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
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Drunk Man Noodles" {...field} />
              </FormControl>
              <FormDescription>
                The item name as it will appear to customers.
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
                  className="field-sizing-content resize-none"
                  placeholder="A brief description of this category."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief (optional) description of the item. This will be
                displayed to customers.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                This is the current status of the item.
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {item
              ? form.formState.isSubmitting
                ? "Updating..."
                : "Update"
              : form.formState.isSubmitting
                ? "Creating..."
                : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ItemForm;
