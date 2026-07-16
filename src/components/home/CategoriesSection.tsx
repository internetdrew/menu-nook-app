import { Plus } from "lucide-react";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import MenuCategoriesSkeleton from "../skeletons/MenuCategoriesSkeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useEffect, useMemo, useState } from "react";
import type { MenuPreviewCategory, MenuPreviewItem } from "@/types/menu";
import FormDialog from "../dialogs/FormDialog";
import CategoryForm from "../forms/CategoryForm";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { accordionEaseOut } from "@/constants";
import { Accordion } from "radix-ui";
import { toast } from "sonner";
import { SortableMenuCategorySection } from "../SortableMenuCategorySection";
import DeleteCategoryAlertDialog from "../dialogs/DeleteCategoryAlertDialog";
import DeleteItemAlertDialog from "../dialogs/DeleteItemAlertDialog";
import ItemForm from "../forms/ItemForm";

type SortableDragData =
  | { type: "category"; categoryId: number }
  | { type: "item"; categoryId: number; itemId: number };

const getCategorySortableId = (categoryId: number) => `category-${categoryId}`;
const getItemSortableId = (itemId: number) => `item-${itemId}`;
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
    <motion.div
      aria-hidden={!isPresent}
      className={className}
      {...motionProps}
    >
      <MenuCategoriesSkeleton />
    </motion.div>
  );
};

const collisionDetection: CollisionDetection = (args) => {
  const activeData = args.active.data.current as SortableDragData | undefined;

  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) => {
      const containerData = container.data.current as
        | SortableDragData
        | undefined;

      if (activeData?.type === "category") {
        return containerData?.type === "category";
      }

      if (activeData?.type === "item") {
        return (
          containerData?.type === "item" &&
          containerData.categoryId === activeData.categoryId
        );
      }

      return true;
    }),
  });
};

const CategoriesSection = () => {
  const { activeMenu, activeMenuId, loading: loadingMenu } = useMenuContext();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState("");
  const [menuCategories, setMenuCategories] = useState<
    MenuPreviewCategory[] | null
  >(null);
  const [selectedCategory, setSelectedCategory] =
    useState<MenuPreviewCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuPreviewItem | null>(
    null,
  );
  const [renderDeleteDialog, setRenderDeleteDialog] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] =
    useState(false);

  const { data: menu, isLoading } = useQuery(
    trpc.menu.getPreview.queryOptions(
      { menuId: activeMenuId ?? "" },
      { enabled: !!activeMenuId },
    ),
  );

  const updateCategoryOrderMutation = useMutation(
    trpc.menuCategory.updateOrder.mutationOptions(),
  );
  const updateItemOrderMutation = useMutation(
    trpc.menuCategoryItem.updateSortOrder.mutationOptions(),
  );

  const fetchedMenuCategories = useMemo(
    () => menu?.menu_categories ?? [],
    [menu?.menu_categories],
  );

  const areMenuCategoriesLoading =
    loadingMenu || (!!activeMenuId && isLoading);
  const displayedMenuCategories = menuCategories ?? fetchedMenuCategories;
  const categoryPanelMotion = shouldReduceMotion
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !activeMenu) return;

    const activeData = active.data.current as SortableDragData | undefined;

    if (activeData?.type === "category") {
      setMenuCategories((currentCategories) => {
        const categories = currentCategories ?? fetchedMenuCategories;
        const oldIndex = categories.findIndex(
          (category) => getCategorySortableId(category.id) === active.id,
        );
        const newIndex = categories.findIndex(
          (category) => getCategorySortableId(category.id) === over.id,
        );

        if (oldIndex === -1 || newIndex === -1) return categories;

        const newOrder = arrayMove(categories, oldIndex, newIndex);
        const newCategoryOrder = newOrder.flatMap((category) =>
          category.sort_index_id == null
            ? []
            : [
                {
                  indexId: category.sort_index_id,
                  categoryId: category.id,
                },
              ],
        );

        if (newCategoryOrder.length !== newOrder.length) {
          toast.error("Failed to update category order. Please try again.");
          return categories;
        }

        updateCategoryOrderMutation.mutate(
          {
            menuId: activeMenu.id,
            newCategoryOrder,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.menu.getPreview.queryKey(),
              });
              queryClient.invalidateQueries({
                queryKey: trpc.menuCategory.getAllSortedByIndex.queryKey(),
              });
              toast.success("Category order updated.");
            },
            onError: (error) => {
              console.error("Failed to update category order:", error);
              queryClient.invalidateQueries({
                queryKey: trpc.menu.getPreview.queryKey(),
              });
              toast.error("Failed to update category order. Please try again.");
            },
          },
        );

        return newOrder;
      });

      return;
    }

    if (activeData?.type === "item") {
      setMenuCategories((currentCategories) => {
        const categories = currentCategories ?? fetchedMenuCategories;

        return categories.map((category) => {
          if (category.id !== activeData.categoryId) return category;

          const oldIndex = category.items.findIndex(
            (item) => getItemSortableId(item.id) === active.id,
          );
          const newIndex = category.items.findIndex(
            (item) => getItemSortableId(item.id) === over.id,
          );

          if (oldIndex === -1 || newIndex === -1) return category;

          const newItems = arrayMove(category.items, oldIndex, newIndex);
          const newItemOrder = newItems.flatMap((item) =>
            item.sort_index_id == null
              ? []
              : [
                  {
                    indexId: item.sort_index_id,
                    itemId: item.id,
                  },
                ],
          );

          if (newItemOrder.length !== newItems.length) {
            toast.error("Failed to update item order. Please try again.");
            return category;
          }

          updateItemOrderMutation.mutate(
            {
              categoryId: category.id,
              newItemOrder,
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: trpc.menu.getPreview.queryKey(),
                });
                queryClient.invalidateQueries({
                  queryKey: trpc.menuCategoryItem.getSortedForCategory.queryKey(
                    {
                      categoryId: category.id,
                    },
                  ),
                });
                toast.success("Item order updated.");
              },
              onError: (error) => {
                console.error("Failed to update item order:", error);
                queryClient.invalidateQueries({
                  queryKey: trpc.menu.getPreview.queryKey(),
                });
                toast.error("Failed to update item order. Please try again.");
              },
            },
          );

          return {
            ...category,
            items: newItems,
          };
        });
      });
    }
  };

  const handleAddItem = (category: MenuPreviewCategory) => {
    setSelectedCategory(category);
    setSelectedItem(null);
    setIsItemDialogOpen(true);
  };

  const handleEditCategory = (category: MenuPreviewCategory) => {
    setSelectedCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: MenuPreviewCategory) => {
    setSelectedCategory(category);
    setIsDeleteCategoryDialogOpen(true);
  };

  const handleEditItem = (
    item: MenuPreviewItem,
    category: MenuPreviewCategory,
  ) => {
    setSelectedCategory(category);
    setSelectedItem(item);
    setIsItemDialogOpen(true);
  };

  const handleDeleteItem = (
    item: MenuPreviewItem,
    category: MenuPreviewCategory,
  ) => {
    setSelectedCategory(category);
    setSelectedItem(item);
    setRenderDeleteDialog(true);
  };

  useEffect(() => {
    setMenuCategories(fetchedMenuCategories);
  }, [fetchedMenuCategories]);

  return (
    <>
      <div className="mt-12 grid">
        <AnimatePresence initial={false}>
          {areMenuCategoriesLoading ? (
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
                <DndContext
                  id="home-menu-preview"
                  sensors={sensors}
                  collisionDetection={collisionDetection}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={displayedMenuCategories.map((category) =>
                      getCategorySortableId(category.id),
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <Accordion.Root
                      type="single"
                      collapsible
                      value={openCategory}
                      onValueChange={setOpenCategory}
                      className="space-y-4"
                    >
                      {displayedMenuCategories.map((category) => (
                        <SortableMenuCategorySection
                          key={category.id}
                          category={category}
                          isOpen={openCategory === String(category.id)}
                          onAddItem={handleAddItem}
                          onEditCategory={handleEditCategory}
                          onDeleteCategory={handleDeleteCategory}
                          onEditItem={handleEditItem}
                          onDeleteItem={handleDeleteItem}
                        />
                      ))}
                    </Accordion.Root>
                  </SortableContext>
                </DndContext>
              </MotionConfig>
              <button
                type="button"
                onClick={() => setIsCategoryDialogOpen(true)}
                className="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-transparent px-4 py-3 text-sm font-semibold text-[#6f5a51] transition-colors hover:bg-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
              >
                <svg
                  className="pointer-events-none absolute inset-0 size-full overflow-visible"
                  aria-hidden="true"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="calc(100% - 1px)"
                    height="calc(100% - 1px)"
                    rx="10"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="6 5"
                    className="text-[#d9cbbd] transition-colors group-hover:text-[#c7b4a3]"
                  />
                </svg>
                <Plus className="size-4" />
                New category
              </button>
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
        isDialogOpen={isCategoryDialogOpen}
        setIsDialogOpen={setIsCategoryDialogOpen}
        formComponent={
          <CategoryForm
            category={selectedCategory}
            onSuccess={() => {
              if (selectedCategory) {
                setSelectedCategory(null);
              }
              setIsCategoryDialogOpen(false);
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
