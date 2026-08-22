import type { StorePreviewCategory, StorePreviewItem } from "@/types/store";
import FormDialog from "../dialogs/FormDialog";
import ItemForm from "../forms/ItemForm";

type ItemDialogProps = {
  selectedCategory: StorePreviewCategory | null;
  selectedItem: StorePreviewItem | null;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  onClose: () => void;
};

const ItemDialog = ({
  selectedCategory,
  selectedItem,
  isDialogOpen,
  setIsDialogOpen,
  onClose,
}: ItemDialogProps) => {
  return (
    <FormDialog
      title={selectedItem ? `Edit ${selectedItem.name}` : "Add Item"}
      description={
        selectedItem
          ? `Edit ${selectedItem.name}.`
          : `Add a new item to ${selectedCategory?.name}.`
      }
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={(open) => {
        if (open) {
          setIsDialogOpen(true);
          return;
        }

        onClose();
      }}
      formComponent={
        <ItemForm
          item={selectedItem}
          chosenCategory={selectedCategory}
          onSuccess={onClose}
        />
      }
    />
  );
};

export default ItemDialog;
