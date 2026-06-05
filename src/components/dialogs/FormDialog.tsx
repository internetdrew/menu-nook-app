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
  const formContent = <div className="no-scrollbar">{formComponent}</div>;

  if (isMobile) {
    return (
      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DrawerContent className="overflow-hidden">
          <DrawerHeader className="px-6 pt-6 pb-2 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="flex max-h-[80dvh] flex-col overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
