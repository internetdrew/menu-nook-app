import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import { useEffect } from "react";
import { Skeleton } from "../ui/skeleton";

const businessFormSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .max(32, "Business name must be at most 32 characters."),
});

export const BusinessDetails = () => {
  const { user, isLoading: authLoading } = useAuth();

  const { data: business, isLoading: businessLoading } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );

  const businessForm = useForm<z.infer<typeof businessFormSchema>>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: business?.name || "",
    },
  });

  const updateBusiness = useMutation(trpc.business.update.mutationOptions());

  useEffect(() => {
    if (business) {
      businessForm.reset({ name: business.name });
    }
  }, [business, businessForm]);

  async function onBusinessSubmit(data: z.infer<typeof businessFormSchema>) {
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
          businessForm.reset({ name: data.name });
        },
        onError: (error) => {
          console.error("Failed to update business:", error);
          toast.error("Failed to update business. Please try again.");
        },
      },
    );
  }

  if (businessLoading)
    return (
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="mt-8 mb-1 h-5 w-1/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mt-2 ml-auto h-10 w-1/8" />
      </div>
    );

  return (
    <div>
      <h2 className="font-medium">Business Settings</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Basic information about your business.
      </p>
      <form
        id="business-name"
        onSubmit={businessForm.handleSubmit(onBusinessSubmit)}
      >
        <Controller
          name="name"
          control={businessForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="business-name">Business Name</FieldLabel>
              <Input
                {...field}
                id="business-name"
                aria-invalid={fieldState.invalid}
                placeholder="Eg. The Blonde Wolf"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </form>
      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          form="business-name"
          size={"sm"}
          disabled={
            businessForm.formState.isSubmitting ||
            !businessForm.formState.isDirty
          }
          tabIndex={businessForm.formState.isDirty ? 0 : -1}
          aria-hidden={!businessForm.formState.isDirty}
        >
          {businessForm.formState.isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
