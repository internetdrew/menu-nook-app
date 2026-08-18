import { useStoreContext } from "@/contexts/StoreContext";
import StoreCategoriesSkeleton from "../skeletons/StoreCategoriesSkeleton";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
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

const categoriesPanelTransition = {
  duration: 0.22,
  ease: accordionEaseOut,
} as const;

const categoriesPanelVariants = {
  initial: { opacity: 0, y: 8, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    y: -4,
    filter: "blur(3px)",
    transition: { duration: 0.14, ease: "easeIn" },
  },
} as const;

type CategoryPanelMotionProps = Pick<
  ComponentProps<typeof motion.div>,
  "initial" | "animate" | "exit" | "transition" | "variants"
>;

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
  const initializedOpenCategoryStoreIdRef = useRef<string | null>(null);
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

  useEffect(() => {
    if (!storeId) {
      initializedOpenCategoryStoreIdRef.current = null;
      setOpenCategory("");
      return;
    }

    if (initializedOpenCategoryStoreIdRef.current === storeId) return;

    const firstCategory = fetchedStoreCategories[0];
    if (!firstCategory) return;

    setOpenCategory(String(firstCategory.id));
    initializedOpenCategoryStoreIdRef.current = storeId;
  }, [fetchedStoreCategories, storeId]);

  const areStoreCategoriesLoading = loadingStore || (!!storeId && isLoading);
  const categoryPanelMotion: CategoryPanelMotionProps = shouldReduceMotion
    ? {
        initial: false,
        animate: "animate",
        exit: "exit",
        variants: {
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        },
        transition: { duration: 0 },
      }
    : {
        initial: "initial",
        animate: "animate",
        exit: "exit",
        variants: categoriesPanelVariants,
        transition: categoriesPanelTransition,
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
      <motion.div aria-busy={areStoreCategoriesLoading} layout>
        <AnimatePresence mode="wait" initial={false}>
          {areStoreCategoriesLoading ? (
            <LoadingCategoriesPanel
              key="categories-loading"
              motionProps={categoryPanelMotion}
            />
          ) : (
            <motion.div
              key="categories-loaded"
              className="pr-1 pl-3"
              layout
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
      </motion.div>

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
