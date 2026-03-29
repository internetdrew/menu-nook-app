import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import DeleteMenuAlertDialog from "@/components/dialogs/DeleteMenuAlertDialog";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { useNavigate } from "react-router";
import { Skeleton } from "../ui/skeleton";

const menuFormSchema = z.object({
  name: z
    .string()
    .min(1, "Menu name is required")
    .max(32, "Menu name must be at most 32 characters."),
});

export const MenuDetails = () => {
  const [deleteMenuDialogOpen, setDeleteMenuDialogOpen] = useState(false);
  const { activeMenu, menus, setActiveMenu, loading } = useMenuContext();
  const navigate = useNavigate();

  const menuForm = useForm<z.infer<typeof menuFormSchema>>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: activeMenu?.name || "",
    },
  });

  useEffect(() => {
    if (activeMenu) {
      menuForm.reset({ name: activeMenu.name });
    }
  }, [activeMenu, menuForm]);

  const updateMenu = useMutation(trpc.menu.update.mutationOptions());

  async function onMenuSubmit(data: z.infer<typeof menuFormSchema>) {
    if (!activeMenu?.id) return;

    await updateMenu.mutateAsync(
      {
        menuId: activeMenu.id,
        name: data.name,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.menu.getAllForBusiness.queryKey(),
          });
          toast.success("Menu name updated successfully!");
          menuForm.reset({ name: data.name });
        },
        onError: (error) => {
          console.error("Failed to update menu:", error);
          toast.error("Failed to update menu. Please try again.");
        },
      },
    );
  }

  const handleMenuDeleted = () => {
    const remainingMenus = menus.filter((m) => m.id !== activeMenu?.id);
    if (remainingMenus.length > 0) {
      setActiveMenu(remainingMenus[0]);
    }
    navigate("/");
  };

  if (loading)
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
      <h2 className="font-medium">Menu Settings</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Update your menu name or delete your menu and all of its categories and
        items.
      </p>
      <form id="menu-name" onSubmit={menuForm.handleSubmit(onMenuSubmit)}>
        <Controller
          name="name"
          control={menuForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="menu-name">Menu Name</FieldLabel>
              <Input
                {...field}
                id="menu-name"
                aria-invalid={fieldState.invalid}
                placeholder="Eg. Lunch Menu"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="mt-4 flex w-full items-center justify-between gap-2">
          <DeleteMenuAlertDialog
            menu={activeMenu}
            open={deleteMenuDialogOpen}
            onOpenChange={setDeleteMenuDialogOpen}
            onDeleted={handleMenuDeleted}
          />
          <Button
            type="submit"
            form="menu-name"
            size={"sm"}
            className="overflow-hidden"
            disabled={
              menuForm.formState.isSubmitting || !menuForm.formState.isDirty
            }
            tabIndex={menuForm.formState.isDirty ? 0 : -1}
            aria-hidden={!menuForm.formState.isDirty}
          >
            {menuForm.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
};
