import { useEffect, useState } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Accordion } from "radix-ui";
import { toast } from "sonner";
import { useStoreContext } from "@/contexts/StoreContext";
import type { StorePreviewCategory, StorePreviewItem } from "@/types/store";
import { trpc } from "@/utils/trpc";
import { SortableStoreCategorySection } from "../SortableStoreCategorySection";

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

const CategoryDragAndDrop = ({
  categories,
  openCategory,
  onOpenCategoryChange,
  onAddItem,
  onEditCategory,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
}: {
  categories: StorePreviewCategory[];
  openCategory: string;
  onOpenCategoryChange: (categoryId: string) => void;
  onAddItem: (category: StorePreviewCategory) => void;
  onDeleteCategory: (category: StorePreviewCategory) => void;
  onEditCategory: (category: StorePreviewCategory) => void;
  onEditItem: (
    item: StorePreviewItem,
    category: StorePreviewCategory,
  ) => void;
  onDeleteItem: (
    item: StorePreviewItem,
    category: StorePreviewCategory,
  ) => void;
}) => {
  const { store } = useStoreContext();
  const queryClient = useQueryClient();
  const [storeCategories, setStoreCategories] = useState<
    StorePreviewCategory[] | null
  >(null);

  const displayedStoreCategories = storeCategories ?? categories;

  const updateCategoryOrderMutation = useMutation(
    trpc.storeCategory.updateOrder.mutationOptions(),
  );
  const updateItemOrderMutation = useMutation(
    trpc.storeCategoryItem.updateSortOrder.mutationOptions(),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !store) return;

    const activeData = active.data.current as SortableDragData | undefined;

    if (activeData?.type === "category") {
      setStoreCategories((currentCategories) => {
        const currentDisplayedCategories = currentCategories ?? categories;
        const oldIndex = currentDisplayedCategories.findIndex(
          (category) => getCategorySortableId(category.id) === active.id,
        );
        const newIndex = currentDisplayedCategories.findIndex(
          (category) => getCategorySortableId(category.id) === over.id,
        );

        if (oldIndex === -1 || newIndex === -1) {
          return currentDisplayedCategories;
        }

        const newOrder = arrayMove(
          currentDisplayedCategories,
          oldIndex,
          newIndex,
        );
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
          return currentDisplayedCategories;
        }

        updateCategoryOrderMutation.mutate(
          {
            storeId: store.id,
            newCategoryOrder,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.store.getPreview.queryKey(),
              });
              queryClient.invalidateQueries({
                queryKey: trpc.storeCategory.getAllSortedByIndex.queryKey(),
              });
              toast.success("Category order updated.");
            },
            onError: (error) => {
              console.error("Failed to update category order:", error);
              queryClient.invalidateQueries({
                queryKey: trpc.store.getPreview.queryKey(),
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
      setStoreCategories((currentCategories) => {
        const currentDisplayedCategories = currentCategories ?? categories;

        return currentDisplayedCategories.map((category) => {
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
                  queryKey: trpc.store.getPreview.queryKey(),
                });
                queryClient.invalidateQueries({
                  queryKey: trpc.storeCategoryItem.getSortedForCategory.queryKey(
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
                  queryKey: trpc.store.getPreview.queryKey(),
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

  useEffect(() => {
    setStoreCategories(categories);
  }, [categories]);

  return (
    <DndContext
      id="home-store-preview"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={displayedStoreCategories.map((category) =>
          getCategorySortableId(category.id),
        )}
        strategy={verticalListSortingStrategy}
      >
        <Accordion.Root
          type="single"
          collapsible
          value={openCategory}
          onValueChange={onOpenCategoryChange}
          className="space-y-4"
        >
          {displayedStoreCategories.map((category) => (
            <SortableStoreCategorySection
              key={category.id}
              category={category}
              isOpen={openCategory === String(category.id)}
              onAddItem={onAddItem}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </Accordion.Root>
      </SortableContext>
    </DndContext>
  );
};

export default CategoryDragAndDrop;
