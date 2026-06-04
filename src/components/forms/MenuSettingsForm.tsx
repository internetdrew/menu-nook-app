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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { MenuRecord } from "@/types/menu";
import {
  createDefaultMenuSlug,
  createMenuSlug,
  menuSlugSchema,
} from "../../../shared/menuSlug";
import { useEffect, useMemo, useState } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Menu name is required.").max(32),
  slug: menuSlugSchema,
});

const PUBLIC_MENU_DOMAIN =
  import.meta.env.VITE_PUBLIC_MENU_DOMAIN || "https://menunook.com";

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
  const initialSlug = menu.slug ?? createDefaultMenuSlug(menu.name);
  const [debouncedSlug, setDebouncedSlug] = useState(initialSlug);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: menu.name,
      slug: initialSlug,
    },
  });

  const slugValue = form.watch("slug");
  const slugHasChanged = slugValue !== initialSlug;
  const slugHasValidShape = menuSlugSchema.safeParse(slugValue).success;
  const shouldCheckSlugAvailability =
    slugHasChanged && slugHasValidShape && !form.formState.errors.slug;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSlug(slugValue);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [slugValue]);

  const slugAvailabilityQuery = useQuery(
    trpc.menu.checkSlugAvailability.queryOptions(
      {
        menuId: menu.id,
        slug: debouncedSlug,
      },
      {
        enabled: shouldCheckSlugAvailability && debouncedSlug === slugValue,
      },
    ),
  );
  const slugAvailability = slugAvailabilityQuery.data;

  const slugStatusMessage = useMemo(() => {
    if (!slugHasChanged) {
      return `This is your current link: ${PUBLIC_MENU_DOMAIN}/m/${initialSlug}`;
    }

    if (slugAvailability?.available) {
      return `Available: ${PUBLIC_MENU_DOMAIN}/m/${slugValue}`;
    }

    if (slugAvailability?.message) {
      return slugAvailability.message;
    }

    if (shouldCheckSlugAvailability) {
      return "Checking availability...";
    }

    return undefined;
  }, [
    initialSlug,
    slugAvailability,
    slugAvailabilityQuery.isFetching,
    shouldCheckSlugAvailability,
    slugHasChanged,
    slugValue,
  ]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await updateMenu.mutateAsync(
      {
        menuId: menu.id,
        name: values.name,
        slug: values.slug,
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
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Public menu link</FormLabel>
              <FormControl>
                <div className="flex overflow-hidden rounded-md border border-input bg-background">
                  <span className="border-input bg-muted text-muted-foreground flex items-center border-r px-3 text-sm whitespace-nowrap">
                    {PUBLIC_MENU_DOMAIN}/m/
                  </span>
                  <Input
                    className="rounded-none border-0 px-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Public menu link"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="marys-bakery"
                    {...field}
                    onChange={(event) => {
                      field.onChange(createMenuSlug(event.target.value));
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Choose a simple link customers will recognize.
              </FormDescription>
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
              {slugHasChanged ? (
                <p className="text-sm text-amber-700">
                  Changing this link may affect places where you already shared
                  your menu. Old links may stop working.
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
            idleLabel="Save"
          />
        </div>
      </form>
    </Form>
  );
};
