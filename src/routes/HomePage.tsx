import FormDialog from "@/components/dialogs/FormDialog";
import DeleteCategoryAlertDialog from "@/components/dialogs/DeleteCategoryAlertDialog";
import DeleteItemAlertDialog from "@/components/dialogs/DeleteItemAlertDialog";
import CategoryForm from "@/components/forms/CategoryForm";
import ItemForm from "@/components/forms/ItemForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { queryClient, trpc } from "@/utils/trpc";
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
import * as Accordion from "@radix-ui/react-accordion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { MotionConfig } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { accordionEaseOut } from "@/constants";
import { SortableMenuCategorySection } from "@/components/SortableMenuCategorySection";
import type {
  MenuItemWithCategory,
  MenuPreviewCategory,
  MenuPreviewData,
  MenuPreviewItem,
} from "@/types/menu";

type SelectedMenuCategoryItem = MenuPreviewItem & MenuItemWithCategory;
export type MenuCategory = MenuPreviewCategory;
type SortableDragData =
  | { type: "category"; categoryId: number }
  | { type: "item"; categoryId: number; itemId: number };

const getCategorySortableId = (categoryId: number) => `category-${categoryId}`;
const getItemSortableId = (itemId: number) => `item-${itemId}`;

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

export const HomePage = () => {
  const [params, setSearchParams] = useSearchParams();
  const [showToast, setShowToast] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] =
    useState(false);
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(
    null,
  );
  const [selectedItem, setSelectedItem] =
    useState<SelectedMenuCategoryItem | null>(null);
  const { activeMenu } = useMenuContext();

  const { data: menuPreview, isLoading } = useQuery(
    trpc.menu.getPreview.queryOptions(
      { menuId: activeMenu?.id ?? "" },
      { enabled: !!activeMenu },
    ),
  );
  const menu = menuPreview as MenuPreviewData | null | undefined;

  const fetchedMenuCategories = useMemo(
    () => menu?.menu_categories ?? [],
    [menu?.menu_categories],
  );
  const [menuCategories, setMenuCategories] = useState<MenuCategory[] | null>(
    null,
  );
  const displayedMenuCategories = menuCategories ?? fetchedMenuCategories;
  const defaultOpenCategories = useMemo(
    () => fetchedMenuCategories.map((category) => String(category.id)),
    [fetchedMenuCategories],
  );
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const updateCategoryOrderMutation = useMutation(
    trpc.menuCategory.updateOrder.mutationOptions(),
  );
  const updateItemOrderMutation = useMutation(
    trpc.menuCategoryItem.updateSortOrder.mutationOptions(),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setOpenCategories(defaultOpenCategories);
  }, [defaultOpenCategories]);

  useEffect(() => {
    setMenuCategories(fetchedMenuCategories);
  }, [fetchedMenuCategories]);

  const invalidateMenuPreview = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.menu.getPreview.queryKey(),
    });
  };

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
              invalidateMenuPreview();
              queryClient.invalidateQueries({
                queryKey: trpc.menuCategory.getAllSortedByIndex.queryKey(),
              });
              toast.success("Category order updated.");
            },
            onError: (error) => {
              console.error("Failed to update category order:", error);
              invalidateMenuPreview();
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
                invalidateMenuPreview();
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
                invalidateMenuPreview();
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

  const handleAddItem = (category: MenuCategory) => {
    setSelectedCategory(category);
    setSelectedItem(null);
    setIsItemDialogOpen(true);
  };

  const handleDeleteCategory = (category: MenuCategory) => {
    setSelectedCategory(category);
    setIsDeleteCategoryDialogOpen(true);
  };

  const handleEditItem = (item: MenuPreviewItem, category: MenuCategory) => {
    setSelectedCategory(category);
    setSelectedItem({
      ...item,
      category: {
        id: category.id,
        name: category.name,
      },
    });
    setIsItemDialogOpen(true);
  };

  const handleDeleteItem = (item: MenuPreviewItem, category: MenuCategory) => {
    setSelectedCategory(category);
    setSelectedItem({
      ...item,
      category: {
        id: category.id,
        name: category.name,
      },
    });
    setIsDeleteItemDialogOpen(true);
  };

  useEffect(() => {
    const successfulSubscription = params.get("success") === "true";

    if (successfulSubscription) {
      setShowToast(true);

      const newParams = new URLSearchParams(params);
      newParams.delete("success");
      setSearchParams(newParams, { replace: true });
    }
  }, [params, setSearchParams]);

  useEffect(() => {
    if (!showToast) return;

    toast("Your menu is live!", {
      position: "top-center",
      duration: 5000,
      action: (
        <Link
          className="ml-auto text-pink-600 underline underline-offset-4"
          to={`/menu/${activeMenu?.id}`}
        >
          View Menu
        </Link>
      ),
    });
  }, [showToast, activeMenu?.id]);

  if (isLoading) {
    return <MenuManagerSkeleton />;
  }

  return (
    <main className="pb-10">
      {displayedMenuCategories.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center shadow-[0_1px_3px_rgba(40,21,19,0.08)]">
          <h2 className="font-semibold text-[#281513]">No categories yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Add your first category to start building this menu.
          </p>
          <Button
            className="mt-4"
            onClick={() => setIsCategoryDialogOpen(true)}
          >
            <Plus />
            Add Category
          </Button>
        </div>
      ) : (
        <MotionConfig transition={{ duration: 0.24, ease: accordionEaseOut }}>
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
                type="multiple"
                value={openCategories}
                onValueChange={setOpenCategories}
                className="space-y-4"
              >
                {displayedMenuCategories.map((category) => (
                  <SortableMenuCategorySection
                    key={category.id}
                    category={category}
                    isOpen={openCategories.includes(String(category.id))}
                    onAddItem={handleAddItem}
                    onDeleteCategory={handleDeleteCategory}
                    onEditItem={handleEditItem}
                    onDeleteItem={handleDeleteItem}
                  />
                ))}
              </Accordion.Root>
            </SortableContext>
          </DndContext>
        </MotionConfig>
      )}

      <FormDialog
        title="Create New Category"
        description="Fill in the details below to create a new category."
        isDialogOpen={isCategoryDialogOpen}
        setIsDialogOpen={setIsCategoryDialogOpen}
        formComponent={
          <CategoryForm onSuccess={() => setIsCategoryDialogOpen(false)} />
        }
      />
      {selectedCategory && (
        <FormDialog
          title={selectedItem ? `Edit ${selectedItem.name}` : `Add Item`}
          description={
            selectedItem
              ? `Edit ${selectedItem.name}.`
              : `Add a new item to ${selectedCategory.name}.`
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
                invalidateMenuPreview();
              }}
            />
          }
        />
      )}
      <DeleteCategoryAlertDialog
        category={selectedCategory}
        open={isDeleteCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteCategoryDialogOpen(open);

          if (!open) {
            invalidateMenuPreview();
          }
        }}
      />
      {selectedItem && (
        <DeleteItemAlertDialog
          item={selectedItem}
          open={isDeleteItemDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteItemDialogOpen(open);

            if (!open) {
              setSelectedItem(null);
              invalidateMenuPreview();
            }
          }}
        />
      )}
    </main>
  );
};

export function MenuManagerSkeleton() {
  return (
    <main data-testid="menu-manager-skeleton" className="pb-10">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_1px_3px_rgba(40,21,19,0.08)]"
          >
            <div className="flex items-center pr-2 pl-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 py-3.5">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className="h-4 w-28 rounded-sm" />
                <Skeleton className="h-3 w-10 rounded-sm" />
              </div>
              <div className="grid size-9 shrink-0 place-items-center">
                <Skeleton className="size-5 rounded-sm" />
              </div>
              <div className="grid size-9 shrink-0 place-items-center">
                <Skeleton className="size-5 rounded-sm" />
              </div>
            </div>
            <div className="border-t border-neutral-200/60 p-2">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
