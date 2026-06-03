import { useMutation } from "@tanstack/react-query";
import { queryClient, trpc } from "@/utils/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trash } from "lucide-react";
import type { MenuRecord } from "@/types/menu";

const DeleteMenuAlertDialog = ({
  menu,
  open,
  onOpenChange,
  onDeleted,
  showTrigger = true,
}: {
  menu: Pick<MenuRecord, "id" | "name"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  showTrigger?: boolean;
}) => {
  const isMobile = useIsMobile();
  const deleteMenuMutation = useMutation(trpc.menu.delete.mutationOptions());

  const deleteMenu = async () => {
    if (menu) {
      await deleteMenuMutation.mutateAsync(
        { menuId: menu.id },
        {
          onSuccess: () => {
            toast.success(`The ${menu.name} menu has been deleted.`);
            queryClient.invalidateQueries({
              queryKey: trpc.menu.getAllForBusiness.queryKey(),
            });
            onOpenChange(false);
            onDeleted?.();
          },
          onError: (error) => {
            console.error("Failed to delete menu:", error);
            toast.error(
              `Failed to delete the ${menu.name} menu. Please try again.`,
            );
          },
        },
      );
    }
  };

  const trigger = (
    <Button size={"sm"} variant="destructive" aria-label="Delete menu">
      <Trash />
      Delete Menu
    </Button>
  );
  const title = (
    <>
      Are you sure you want to delete the{" "}
      <span className="text-pink-600">{menu?.name}</span> menu?
    </>
  );
  const description = (
    <>
      This will permanently delete{" "}
      <span className="font-semibold">{menu?.name}</span> and all of its
      categories and items. This action cannot be undone.
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {showTrigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent>
          <DrawerHeader className="px-6 pt-6 pb-2 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="px-6 pt-2 pb-6">
            <Button onClick={deleteMenu}>Delete</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteMenu}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMenuAlertDialog;
