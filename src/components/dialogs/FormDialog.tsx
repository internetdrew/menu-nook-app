import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface DialogProps {
  title: string;
  description?: string;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  formComponent: React.JSX.Element;
}

const FormDialog = ({
  title,
  description,
  isDialogOpen,
  setIsDialogOpen,
  formComponent,
}: DialogProps) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="no-scrollbar -mx-4 max-h-[60vh] overflow-y-auto px-4">
          {formComponent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
