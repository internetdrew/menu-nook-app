import { useMutation } from "@tanstack/react-query";
import type { CategoryIndex } from "../ManageCategoriesDropdown";
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

const DeleteCategoryAlertDialog = ({
  category,
  open,
  onOpenChange,
}: {
  category: CategoryIndex["category"] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const deleteCategoryMutation = useMutation(
    trpc.menuCategory.delete.mutationOptions(),
  );

  const deleteCategory = async () => {
    if (category) {
      await deleteCategoryMutation.mutateAsync(
        { categoryId: category.id },
        {
          onSuccess: () => {
            toast.success(`${category.name} has been deleted.`);
            queryClient.invalidateQueries({
              queryKey: trpc.menuCategory.getAllSortedByIndex.queryKey(),
            });
            onOpenChange(false);
          },
          onError: (error) => {
            console.error("Failed to delete category:", error);
            toast.error(`Failed to delete ${category.name}. Please try again.`);
          },
        },
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete the{" "}
            <span className="text-pink-600">{category?.name}</span> category?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-semibold">{category?.name}</span> and all of
            its associated items. If you just want to change the name, please
            use the <span className="font-semibold">Edit</span> option instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteCategory}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default DeleteCategoryAlertDialog;
