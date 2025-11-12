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
  formComponent?: React.JSX.Element;
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
        {formComponent}
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
