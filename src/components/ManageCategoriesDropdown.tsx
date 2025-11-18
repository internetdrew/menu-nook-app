import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import type { AppRouter } from "../../server";
import type { inferRouterOutputs } from "@trpc/server";
import FormDialog from "./dialogs/FormDialog";
import CategoryForm from "./forms/CategoryForm";

import DeleteCategoryAlertDialog from "./dialogs/DeleteCategoryAlertDialog";
import { MoreHorizontal } from "lucide-react";

export type CategoryIndex =
  inferRouterOutputs<AppRouter>["category"]["getAllSortedByIndex"][number];

interface ManageCategoriesDropdownProps {
  category: CategoryIndex["category"];
}

const ManageCategoriesDropdown = ({
  category,
}: ManageCategoriesDropdownProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<
    CategoryIndex["category"] | null
  >(null);
  const [renderCategoryDialog, setRenderCategoryDialog] = useState(false);
  const [categoryForEdit, setCategoryForEdit] = useState<
    CategoryIndex["category"] | null
  >(null);
  // const [categoryIndexes, setCategoryIndexes] = useState<CategoryIndex[]>([]);

  // useEffect(() => {
  //   if (indexedCategories) {
  //     setCategoryIndexes(indexedCategories);
  //   }
  // }, [indexedCategories]);

  const handleDelete = (category: CategoryIndex["category"]) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (category: CategoryIndex["category"]) => {
    setCategoryForEdit(category);
    setRenderCategoryDialog(true);
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="ml-auto">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => handleEdit(category)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(category)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        title={
          categoryForEdit ? `Edit ${categoryForEdit.name}` : "Add Category"
        }
        description={
          categoryForEdit
            ? `Edit your ${categoryForEdit.name} category. You can update the name and other details.`
            : "Add a new category to your menu. You can add items to this category afterward."
        }
        isDialogOpen={renderCategoryDialog}
        setIsDialogOpen={setRenderCategoryDialog}
        formComponent={
          <CategoryForm
            category={categoryForEdit}
            onSuccess={() => {
              setRenderCategoryDialog(false);
            }}
          />
        }
      />

      <DeleteCategoryAlertDialog
        category={categoryToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
};

export default ManageCategoriesDropdown;
