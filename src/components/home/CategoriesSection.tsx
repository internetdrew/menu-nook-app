import { useStoreContext } from "@/contexts/StoreContext";
import StoreCategoriesSkeleton from "../skeletons/StoreCategoriesSkeleton";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useEffect, useMemo, useState } from "react";
import type { StorePreviewCategory, StorePreviewItem } from "@/types/store";
import FormDialog from "../dialogs/FormDialog";
import CategoryForm from "../forms/CategoryForm";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { accordionEaseOut } from "@/constants";
import DeleteCategoryAlertDialog from "../dialogs/DeleteCategoryAlertDialog";
import DeleteItemAlertDialog from "../dialogs/DeleteItemAlertDialog";
import ItemForm from "../forms/ItemForm";
import CategoryDragAndDrop from "./CategoryDragAndDrop";
import { Button } from "@/components/ui/button";
import EmptyCategoriesState from "./EmptyCategoriesState";

const categoriesLoadTransition = {
  duration: 0.22,
  ease: accordionEaseOut,
} as const;

type CategoryPanelMotionProps = {
  initial: false | { opacity: number; y: number };
  animate: { opacity: number; y?: number };
  exit: { opacity: number; y?: number };
  transition: { duration: number; ease?: typeof accordionEaseOut };
};

const LoadingCategoriesPanel = ({
  className,
  motionProps,
}: {
  className?: string;
  motionProps: CategoryPanelMotionProps;
}) => {
  const isPresent = useIsPresent();

  return (
    <motion.div aria-hidden={!isPresent} className={className} {...motionProps}>
      <StoreCategoriesSkeleton />
    </motion.div>
  );
};

const CategoriesSection = () => {
  const { storeId, loading: loadingStore } = useStoreContext();
  const shouldReduceMotion = useReducedMotion();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<StorePreviewCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<StorePreviewItem | null>(
    null,
  );
  const [renderDeleteDialog, setRenderDeleteDialog] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] =
    useState(false);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] =
    useState(false);

  const { data: storePreview, isLoading } = useQuery(
    trpc.store.getPreview.queryOptions(
      { storeId: storeId ?? "" },
      { enabled: !!storeId },
    ),
  );

  const fetchedStoreCategories = useMemo(
    () => storePreview?.store_menu_categories ?? [],
    [storePreview?.store_menu_categories],
  );

  const areStoreCategoriesLoading = loadingStore || (!!storeId && isLoading);
  const categoryPanelMotion: CategoryPanelMotionProps = shouldReduceMotion
    ? {
        initial: false,
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: categoriesLoadTransition,
      };

  const handleAddItem = (category: StorePreviewCategory) => {
    setSelectedCategory(category);
    setSelectedItem(null);
    setIsItemDialogOpen(true);
  };

  const handleEditCategory = (category: StorePreviewCategory) => {
    setSelectedCategory(category);
    setIsCreateCategoryDialogOpen(false);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: StorePreviewCategory) => {
    setSelectedCategory(category);
    setIsDeleteCategoryDialogOpen(true);
  };

  const handleEditItem = (
    item: StorePreviewItem,
    category: StorePreviewCategory,
  ) => {
    setSelectedCategory(category);
    setSelectedItem(item);
    setIsItemDialogOpen(true);
  };

  const handleDeleteItem = (
    item: StorePreviewItem,
    category: StorePreviewCategory,
  ) => {
    setSelectedCategory(category);
    setSelectedItem(item);
    setRenderDeleteDialog(true);
  };

  useEffect(() => {
    if (isCreateCategoryDialogOpen) {
      setSelectedCategory(null);
      setIsCategoryDialogOpen(false);
    }
  }, [isCreateCategoryDialogOpen]);

  return (
    <>
      <div className="">
        <AnimatePresence initial={false}>
          {areStoreCategoriesLoading ? (
            <LoadingCategoriesPanel
              key="categories-loading"
              className="col-start-1 row-start-1"
              motionProps={categoryPanelMotion}
            />
          ) : (
            <motion.div
              key="categories-loaded"
              className="col-start-1 row-start-1 pr-1 pl-3"
              {...categoryPanelMotion}
            >
              <MotionConfig
                transition={{ duration: 0.24, ease: accordionEaseOut }}
              >
                {fetchedStoreCategories.length > 0 ? (
                  <>
                    <div className="mb-4 flex">
                      <Button
                        size={"sm"}
                        className="ml-auto"
                        onClick={() => setIsCreateCategoryDialogOpen(true)}
                      >
                        Add Category
                      </Button>
                    </div>
                    <CategoryDragAndDrop
                      categories={fetchedStoreCategories}
                      openCategory={openCategory}
                      onOpenCategoryChange={setOpenCategory}
                      onAddItem={handleAddItem}
                      onEditCategory={handleEditCategory}
                      onDeleteCategory={handleDeleteCategory}
                      onEditItem={handleEditItem}
                      onDeleteItem={handleDeleteItem}
                    />
                  </>
                ) : (
                  <EmptyCategoriesState
                    setIsCreateCategoryDialogOpen={
                      setIsCreateCategoryDialogOpen
                    }
                  />
                )}
              </MotionConfig>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FormDialog
        title={
          selectedCategory
            ? `Edit ${selectedCategory?.name}`
            : "Create a new category"
        }
        description={
          selectedCategory
            ? `Edit details for ${selectedCategory.name}`
            : "Fill in the details below to create a new category."
        }
        isDialogOpen={isCategoryDialogOpen || isCreateCategoryDialogOpen}
        setIsDialogOpen={(open) => {
          if (open) return;

          setIsCategoryDialogOpen(false);
          setIsCreateCategoryDialogOpen(false);
          setSelectedCategory(null);
        }}
        formComponent={
          <CategoryForm
            category={selectedCategory}
            onSuccess={() => {
              setSelectedCategory(null);
              setIsCategoryDialogOpen(false);
              setIsCreateCategoryDialogOpen(false);
            }}
          />
        }
      />

      <FormDialog
        title={selectedItem ? `Edit ${selectedItem.name}` : `Add Item`}
        description={
          selectedItem
            ? `Edit ${selectedItem.name}.`
            : `Add a new item to ${selectedCategory?.name}.`
        }
        isDialogOpen={isItemDialogOpen}
        setIsDialogOpen={setIsItemDialogOpen}
        formComponent={
          <ItemForm
            item={selectedItem}
            chosenCategory={selectedCategory}
            onSuccess={() => {
              setIsItemDialogOpen(false);
              setSelectedItem(null);
              setSelectedCategory(null);
            }}
          />
        }
      />

      <DeleteCategoryAlertDialog
        category={selectedCategory}
        open={isDeleteCategoryDialogOpen}
        onOpenChange={setIsDeleteCategoryDialogOpen}
      />

      <DeleteItemAlertDialog
        item={selectedItem}
        open={renderDeleteDialog}
        onOpenChange={setRenderDeleteDialog}
      />
    </>
  );
};

export default CategoriesSection;
