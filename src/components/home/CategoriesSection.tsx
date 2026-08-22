import { useEffect, useRef, useState } from "react";
import type { StorePreviewCategory, StorePreviewItem } from "@/types/store";
import FormDialog from "../dialogs/FormDialog";
import CategoryForm from "../forms/CategoryForm";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { accordionEaseOut } from "@/constants";
import DeleteCategoryAlertDialog from "../dialogs/DeleteCategoryAlertDialog";
import DeleteItemAlertDialog from "../dialogs/DeleteItemAlertDialog";
import ItemForm from "../forms/ItemForm";
import CategoryDragAndDrop from "./CategoryDragAndDrop";
import { Button } from "@/components/ui/button";
import EmptyCategoriesState from "./EmptyCategoriesState";

type CategoriesSectionProps = {
  categories: StorePreviewCategory[];
};

const CategoriesSection = ({ categories }: CategoriesSectionProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState("");
  const initializedOpenCategoryIdRef = useRef<number | null>(null);
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

  useEffect(() => {
    const firstCategory = categories[0];

    if (!firstCategory) {
      initializedOpenCategoryIdRef.current = null;
      setOpenCategory("");
      return;
    }

    if (initializedOpenCategoryIdRef.current === firstCategory.id) return;

    setOpenCategory(String(firstCategory.id));
    initializedOpenCategoryIdRef.current = firstCategory.id;
  }, [categories]);

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
      <motion.div layout>
        <motion.div
          className="pr-1 pl-3"
          layout
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, y: 8, filter: "blur(3px)" }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, filter: "blur(0px)" }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : {
                  opacity: 0,
                  y: -4,
                  filter: "blur(3px)",
                  transition: { duration: 0.14, ease: "easeIn" },
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.22, ease: accordionEaseOut }
          }
        >
          <AnimatePresence mode="wait">
            {categories.length > 0 ? (
              <motion.div
                key="categories"
                layout
                transition={{ duration: 0.24, ease: accordionEaseOut }}
              >
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
                  categories={categories}
                  openCategory={openCategory}
                  onOpenCategoryChange={setOpenCategory}
                  onAddItem={handleAddItem}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty-categories"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, y: 0, transition: { duration: 0 } }
                    : {
                        opacity: 0,
                        y: -8,
                        transition: { duration: 0.14, ease: "easeIn" },
                      }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.26, ease: [0.215, 0.61, 0.355, 1] }
                }
              >
                <EmptyCategoriesState
                  setIsCreateCategoryDialogOpen={setIsCreateCategoryDialogOpen}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
