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
} from "../ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MenuCategoryRecord } from "@/types/menu";

const DeleteCategoryAlertDialog = ({
  category,
  open,
  onOpenChange,
}: {
  category: Pick<MenuCategoryRecord, "id" | "name"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const isMobile = useIsMobile();
  const deleteCategoryMutation = useMutation(
    trpc.menuCategory.delete.mutationOptions(),
  );

  const deleteCategory = async () => {
    if (category) {
      await deleteCategoryMutation.mutateAsync(
        { categoryId: category.id },
        {
          onSuccess: () => {
            toast.success(
              `The ${category.name} category has been deleted from your menu.`,
            );
            queryClient.invalidateQueries({
              queryKey: trpc.menuCategory.getAllSortedByIndex.queryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: trpc.menu.getPreview.queryKey(),
            });
            onOpenChange(false);
          },
          onError: (error) => {
            console.error("Failed to delete category:", error);
            toast.error(
              `Failed to delete the ${category.name} category. Please try again.`,
            );
          },
        },
      );
    }
  };

  const title = (
    <>
      Are you sure you want to delete the{" "}
      <span className="text-pink-600">{category?.name}</span> category?
    </>
  );
  const description = (
    <>
      This will permanently delete{" "}
      <span className="font-semibold">{category?.name}</span> and all of its
      associated items from your menu. If you just want to change the name,
      cancel this operation use the <span className="font-semibold">Edit</span>{" "}
      option instead.
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="px-6 pt-6 pb-2 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="px-6 pt-2 pb-6">
            <Button onClick={deleteCategory}>Delete</Button>
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteCategory}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default DeleteCategoryAlertDialog;
