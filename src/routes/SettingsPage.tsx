import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building, Info } from "lucide-react";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .max(32, "Business name must be at most 32 characters."),
});

export const SettingsPage = () => {
  const { user, isLoading: authLoading } = useAuth();

  const { data: business } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: business?.name || "",
    },
  });

  const updateBusiness = useMutation(trpc.business.update.mutationOptions());

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!business?.id) return;

    await updateBusiness.mutateAsync(
      {
        id: business.id,
        name: data.name,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.business.getForUser.queryKey(),
          });
          toast.success("Business name updated successfully!");
          form.reset({ name: data.name });
        },
        onError: (error) => {
          console.error("Failed to update business:", error);
          toast.error("Failed to update business. Please try again.");
        },
      },
    );
  }

  return (
    <div className="my-4">
      <header className="flex items-center">
        <h1 className="font-medium">Settings</h1>
        <Popover>
          <PopoverTrigger>
            <Info className="ml-1 size-3" />
          </PopoverTrigger>
          <PopoverContent className="text-sm">
            This is where you can manage your settings and preferences for{" "}
            <span className="font-semibold">{business?.name}</span> and its
            menus.
          </PopoverContent>
        </Popover>
      </header>

      <section className="mt-8">
        <div className="grid md:grid-cols-2">
          <Item variant={"outline"}>
            <ItemMedia variant="icon">
              <Building />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Business Details</ItemTitle>
              <ItemDescription>
                If it involves your business, it can be updated here.
              </ItemDescription>
              <form
                id="business-name"
                className="mt-4 grid grid-cols-[1fr_auto] items-end gap-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="business-name">
                        Business Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="business-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="Eg. The Blonde Wolf"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-in-out",
                    form.formState.isDirty
                      ? "grid-cols-[1fr] opacity-100"
                      : "grid-cols-[0fr] opacity-0",
                  )}
                >
                  <Button
                    type="submit"
                    form="business-name"
                    size={"sm"}
                    className="overflow-hidden"
                    disabled={form.formState.isSubmitting}
                    tabIndex={form.formState.isDirty ? 0 : -1}
                    aria-hidden={!form.formState.isDirty}
                  >
                    {form.formState.isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </ItemContent>
          </Item>
        </div>
      </section>
    </div>
  );
};
