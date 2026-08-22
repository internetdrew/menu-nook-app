import type { StorePreviewCategory } from "@/types/store";
import FormDialog from "../dialogs/FormDialog";
import CategoryForm from "../forms/CategoryForm";

type CategoryDialogProps = {
  selectedCategory: StorePreviewCategory | null;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  setSelectedCategory: (category: StorePreviewCategory | null) => void;
};

const CategoryDialog = ({
  selectedCategory,
  isDialogOpen,
  setIsDialogOpen,
  setSelectedCategory,
}: CategoryDialogProps) => {
  return (
    <FormDialog
      title={
        selectedCategory
          ? `Edit ${selectedCategory.name}`
          : "Create a new category"
      }
      description={
        selectedCategory
          ? `Edit details for ${selectedCategory.name}`
          : "Fill in the details below to create a new category."
      }
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={(open) => {
        setIsDialogOpen(open);

        if (!open) {
          setSelectedCategory(null);
        }
      }}
      formComponent={
        <CategoryForm
          category={selectedCategory}
          onSuccess={() => {
            setSelectedCategory(null);
            setIsDialogOpen(false);
          }}
        />
      }
    />
  );
};

export default CategoryDialog;
