import { queryClient, trpc } from "@/utils/trpc";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
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
import { toast } from "sonner";

interface DeleteItemAlertDialogProps {
  item: {
    id: number;
    name: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteItemAlertDialog = ({
  item,
  open,
  onOpenChange,
}: DeleteItemAlertDialogProps) => {
  const isMobile = useIsMobile();
  const deleteItem = useMutation(
    trpc.menuCategoryItem.delete.mutationOptions(),
  );

  if (!item) return null;

  const onDelete = async () => {
    await deleteItem.mutateAsync(
      {
        id: item.id,
      },
      {
        onSuccess: () => {
          toast.success(`${item.name} has been deleted.`);
          queryClient.invalidateQueries({
            queryKey: trpc.menuCategoryItem.getSortedForCategory.queryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.menu.getPreview.queryKey(),
          });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(`Failed to delete ${item.name}. Please try again.`);
        },
      },
    );
  };

  const title = `Delete ${item.name}?`;
  const description = (
    <>
      This action cannot be undone. This will permanently delete{" "}
      <span className="font-semibold">{item.name}</span> from your menu.
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
            <Button onClick={onDelete}>Continue</Button>
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
          <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteItemAlertDialog;
