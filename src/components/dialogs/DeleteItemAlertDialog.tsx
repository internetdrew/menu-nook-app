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
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "server";

type ItemIndex =
  inferRouterOutputs<AppRouter>["menuCategoryItem"]["getSortedForCategory"][number];

interface DeleteItemAlertDialogProps {
  item: ItemIndex["item"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteItemAlertDialog = ({
  item,
  open,
  onOpenChange,
}: DeleteItemAlertDialogProps) => {
  const deleteItem = useMutation(
    trpc.menuCategoryItem.delete.mutationOptions(),
  );

  const onDelete = async () => {
    await deleteItem.mutateAsync(
      {
        id: item.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success(`${item.name} has been deleted.`);
          queryClient.invalidateQueries({
            queryKey: trpc.menuCategoryItem.getSortedForCategory.queryKey(),
          });
        },
        onError: () => {
          toast.error(`Failed to delete ${item.name}. Please try again.`);
        },
      },
    );
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-semibold">{item.name}</span> from your menu.
          </AlertDialogDescription>
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
