import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FormDialog from "@/components/dialogs/FormDialog";

interface EmptyStatePromptProps {
  cardTitle: string;
  cardDescription?: string;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  buttonText: string;
  formComponent: React.ComponentType<{ onSuccess: () => void }>;
  formDialogTitle: string;
  formDialogDescription?: string;
}

const EmptyStatePrompt = ({
  formComponent: FormComponent,
  cardTitle,
  cardDescription,
  isDialogOpen,
  setIsDialogOpen,
  buttonText,
  formDialogTitle,
  formDialogDescription,
}: EmptyStatePromptProps) => {
  return (
    <>
      <Card className="mx-auto mt-28 max-w-sm text-center">
        <CardHeader className="text-center">
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
            {buttonText}
          </Button>
        </CardFooter>
      </Card>
      <FormDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        title={formDialogTitle}
        description={formDialogDescription}
        formComponent={
          <FormComponent onSuccess={() => setIsDialogOpen(false)} />
        }
      />
    </>
  );
};

export default EmptyStatePrompt;
