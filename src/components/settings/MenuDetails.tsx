import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { List } from "lucide-react";
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
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { useEffect, useState } from "react";
import DeleteMenuAlertDialog from "@/components/dialogs/DeleteMenuAlertDialog";
import { useNavigate } from "react-router";

const menuFormSchema = z.object({
  name: z
    .string()
    .min(1, "Menu name is required")
    .max(32, "Menu name must be at most 32 characters."),
});

export const MenuDetails = () => {
  const { menus, activeMenu, setActiveMenu } = useMenuContext();
  const [deleteMenuDialogOpen, setDeleteMenuDialogOpen] = useState(false);
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

  return (
    <>
      <Item variant={"outline"}>
        <ItemMedia variant="icon">
          <List />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Menu Details</ItemTitle>
          <ItemDescription>
            Manage settings for{" "}
            <span className="font-semibold">{activeMenu?.name}</span>.
          </ItemDescription>
          <form
            id="menu-name"
            className="mt-4 grid grid-cols-[1fr_auto] items-end gap-2"
            onSubmit={menuForm.handleSubmit(onMenuSubmit)}
          >
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div
              className={cn(
                "grid transition-all duration-150 ease-in-out",
                menuForm.formState.isDirty
                  ? "grid-cols-[1fr] opacity-100"
                  : "grid-cols-[0fr] opacity-0",
              )}
            >
              <Button
                type="submit"
                form="menu-name"
                size={"sm"}
                className="overflow-hidden"
                disabled={menuForm.formState.isSubmitting}
                tabIndex={menuForm.formState.isDirty ? 0 : -1}
                aria-hidden={!menuForm.formState.isDirty}
              >
                {menuForm.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </ItemContent>
        {/* <ItemActions className="mb-auto">
        
        </ItemActions> */}
      </Item>

      <DeleteMenuAlertDialog
        menu={activeMenu}
        open={deleteMenuDialogOpen}
        onOpenChange={setDeleteMenuDialogOpen}
        onDeleted={handleMenuDeleted}
      />
    </>
  );
};
