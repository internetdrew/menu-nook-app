import CreateRestaurantForm from "../forms/CreateRestaurantForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface DialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

const CreateRestaurantDialog = ({
  isDialogOpen,
  setIsDialogOpen,
}: DialogProps) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Restaurant</DialogTitle>
          <DialogDescription>
            Create a new restaurant to manage menus for.
          </DialogDescription>
        </DialogHeader>
        <CreateRestaurantForm onSuccess={() => setIsDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateRestaurantDialog;
