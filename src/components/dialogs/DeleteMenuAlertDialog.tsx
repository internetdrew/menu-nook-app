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
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server";
import { Button } from "../ui/button";
import { Trash } from "lucide-react";

type Menu = inferRouterOutputs<AppRouter>["menu"]["getAllForBusiness"][number];

const DeleteMenuAlertDialog = ({
  menu,
  open,
  onOpenChange,
  onDeleted,
}: {
  menu: Menu | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) => {
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger className="ml-auto">
        <Button size={"icon-sm"} variant="outline">
          <Trash className="text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete the{" "}
            <span className="text-pink-600">{menu?.name}</span> menu?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-semibold">{menu?.name}</span> and all of its
            categories and items. This action cannot be undone.
          </AlertDialogDescription>
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
