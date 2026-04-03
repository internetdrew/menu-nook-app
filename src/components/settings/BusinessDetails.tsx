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
import { BusinessLogoUpload } from "./BusinessLogoUpload";
import { Link } from "react-router";
import { useMenuContext } from "@/contexts/ActiveMenuContext";

const businessFormSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .max(32, "Business name must be at most 32 characters."),
});

export const BusinessDetails = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { activeMenu } = useMenuContext();

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
        <div className="mt-8 space-y-6">
          <div>
            <Skeleton className="mb-2 h-5 w-1/4" />
            <div className="flex items-start gap-4">
              <Skeleton className="aspect-[3/2] w-full max-w-44 rounded-2xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
          <div>
            <Skeleton className="mb-1 h-5 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
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
        className="space-y-6"
      >
        {business && <BusinessLogoUpload business={business} />}
        <p className="text-muted-foreground text-xs">
          Your business logo will appear above your business name on your menu.
          To see what it looks like, head on over to the{" "}
          <Link
            to={`/preview/menu/${activeMenu?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:decoration-muted-foreground underline decoration-neutral-300 underline-offset-4 transition duration-300"
          >
            menu preview page
          </Link>
          . We recommend using an image with a transparent background for best
          results.
        </p>
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
