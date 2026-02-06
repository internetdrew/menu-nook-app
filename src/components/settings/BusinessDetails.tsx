import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";

const businessFormSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .max(32, "Business name must be at most 32 characters."),
});

export const BusinessDetails = () => {
  const { user, isLoading: authLoading } = useAuth();

  const { data: business } = useQuery(
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Details</CardTitle>
        <CardDescription>
          If it involves your business, it can be updated here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="business-name"
          className="grid grid-cols-[1fr_auto] items-end gap-2"
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <div
            className={cn(
              "grid transition-all duration-150 ease-in-out",
              businessForm.formState.isDirty
                ? "grid-cols-[1fr] opacity-100"
                : "grid-cols-[0fr] opacity-0",
            )}
          >
            <Button
              type="submit"
              form="business-name"
              size={"sm"}
              className="overflow-hidden"
              disabled={businessForm.formState.isSubmitting}
              tabIndex={businessForm.formState.isDirty ? 0 : -1}
              aria-hidden={!businessForm.formState.isDirty}
            >
              {businessForm.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
