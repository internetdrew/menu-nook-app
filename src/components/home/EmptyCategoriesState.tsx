import { Button } from "../ui/button";

const EmptyCategoriesState = ({
  setIsCreateCategoryDialogOpen,
}: {
  setIsCreateCategoryDialogOpen: (open: boolean) => void;
}) => {
  return (
    <div className="mx-auto mt-12 max-w-md text-center">
      <h2 className="font-medium">No categories created</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        You haven't created any item categories yet. Once you do, you'll be able
        to add items to them and manage your menu.
      </p>
      <Button
        size={"sm"}
        className="mt-4"
        onClick={() => setIsCreateCategoryDialogOpen(true)}
      >
        Add Category
      </Button>
    </div>
  );
};

export default EmptyCategoriesState;
