import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "../ui/badge";
import { LockIcon } from "lucide-react";
import {
  createEditableStoreSlug,
  createStoreSlug,
  STORE_SLUG_MAX_LENGTH,
  STORE_SLUG_WARNING_THRESHOLD,
  storeSlugSchema,
} from "../../../shared/storeSlug";
import {
  STORE_NAME_MAX_LENGTH,
  STORE_NAME_WARNING_THRESHOLD,
  storeNameSchema,
} from "../../../shared/storeName";
import RemainingCharacters from "./RemainingCharacters";

const formSchema = z.object({
  name: storeNameSchema,
  slug: storeSlugSchema,
});

const PUBLIC_STORE_DOMAIN =
  import.meta.env.VITE_PUBLIC_STORE_DOMAIN ||
  import.meta.env.VITE_PUBLIC_MENU_DOMAIN ||
  "https://menunook.com";

export const CreateStoreForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const createStore = useMutation(trpc.store.create.mutationOptions());
  const queryClient = useQueryClient();
  const [debouncedSlug, setDebouncedSlug] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const slugValue = form.watch("slug");
  const nameValue = form.watch("name");
  const slugHasValidShape = storeSlugSchema.safeParse(slugValue).success;
  const shouldCheckSlugAvailability =
    slugHasValidShape && !form.formState.errors.slug;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSlug(slugValue);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [slugValue]);

  const slugAvailabilityQuery = useQuery(
    trpc.store.checkSlugAvailability.queryOptions(
      {
        slug: debouncedSlug,
      },
      {
        enabled:
          shouldCheckSlugAvailability &&
          !!debouncedSlug &&
          debouncedSlug === slugValue,
      },
    ),
  );
  const slugAvailability = slugAvailabilityQuery.data;

  const slugStatusMessage = useMemo(() => {
    if (slugAvailability?.available) {
      return `Available: ${PUBLIC_STORE_DOMAIN}/m/${slugValue}`;
    }

    if (slugAvailability?.message) {
      return slugAvailability.message;
    }

    if (shouldCheckSlugAvailability && slugValue) {
      return "Checking availability...";
    }

    return undefined;
  }, [shouldCheckSlugAvailability, slugAvailability, slugValue]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createStore.mutateAsync(values, {
      onError: (error) => {
        const fieldLevelMessages = new Set([
          "That link is already taken.",
          "Use only lowercase letters, numbers, and hyphens.",
          "This link is reserved. Choose another one.",
          "Use at least 3 characters with lowercase letters, numbers, and hyphens.",
          "Use at most 60 characters with lowercase letters, numbers, and hyphens.",
        ]);

        if (fieldLevelMessages.has(error.message)) {
          form.setError("slug", {
            type: "server",
            message: error.message,
          });
          return;
        }

        console.error("Failed to create store:", error);
        toast.error("Failed to create store. Please try again.");
      },
      onSuccess: async (store) => {
        queryClient.setQueryData(trpc.store.getForUser.queryKey(), store);
        toast.success(`${store.name} created successfully.`);
        onSuccess();
        await queryClient.invalidateQueries({
          queryKey: trpc.store.getForUser.queryKey(),
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store name</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  maxLength={STORE_NAME_MAX_LENGTH}
                  placeholder="E.g. Sunny Deli"
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);

                    if (!form.getFieldState("slug").isDirty) {
                      form.setValue(
                        "slug",
                        createStoreSlug(event.target.value),
                        {
                          shouldDirty: false,
                          shouldValidate: true,
                        },
                      );
                    }
                  }}
                />
              </FormControl>
              <div className="flex items-start justify-between gap-4">
                <FormDescription>
                  Use the name customers see on your storefront.
                </FormDescription>
                <RemainingCharacters
                  value={nameValue}
                  limit={STORE_NAME_MAX_LENGTH}
                  warningThreshold={STORE_NAME_WARNING_THRESHOLD}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Public store link</FormLabel>
                <Badge
                  variant="outline"
                  className="text-muted-foreground inline-flex items-center text-xs"
                >
                  <LockIcon aria-hidden="true" />
                  Permanent
                </Badge>
              </div>
              <FormControl>
                <div className="border-input bg-background flex overflow-hidden rounded-md border">
                  <span className="border-input bg-muted text-muted-foreground flex items-center border-r px-3 text-sm whitespace-nowrap">
                    {PUBLIC_STORE_DOMAIN}/m/
                  </span>
                  <Input
                    className="rounded-none border-0 px-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Public store link"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    maxLength={STORE_SLUG_MAX_LENGTH}
                    spellCheck={false}
                    placeholder="sunny-deli"
                    {...field}
                    onChange={(event) => {
                      field.onChange(
                        createEditableStoreSlug(event.target.value),
                      );
                    }}
                  />
                </div>
              </FormControl>
              <div className="flex items-start justify-between gap-4">
                <FormDescription>
                  Choose carefully. You can rename your store later, but{" "}
                  <strong>
                    this public link cannot be changed after setup
                  </strong>
                  .
                </FormDescription>
                <RemainingCharacters
                  value={slugValue}
                  limit={STORE_SLUG_MAX_LENGTH}
                  warningThreshold={STORE_SLUG_WARNING_THRESHOLD}
                />
              </div>
              {slugStatusMessage ? (
                <p
                  className={`text-sm ${
                    slugAvailability?.available === true
                      ? "text-emerald-700"
                      : slugAvailability?.available === false
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {slugStatusMessage}
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <AnimatedSubmitButton
            isSubmitting={form.formState.isSubmitting}
            disabled={
              !form.formState.isDirty ||
              !!form.formState.errors.slug ||
              slugAvailabilityQuery.isFetching ||
              slugAvailability?.available === false
            }
            idleLabel="Create"
          />
        </div>
      </form>
    </Form>
  );
};
