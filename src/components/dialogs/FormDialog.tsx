import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const formContent = <div className="no-scrollbar p-6">{formComponent}</div>;

  if (isMobile) {
    return (
      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DrawerContent>
          <DrawerHeader className="px-6 pt-6 pb-2 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div>{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
