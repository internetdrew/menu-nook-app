import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { usePlaceContext } from "@/contexts/ActivePlaceContext";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import type { AppRouter } from "../../server";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type CategoryIndex =
  inferRouterOutputs<AppRouter>["category"]["getAllSortedByIndex"][number];
type ItemIndex =
  inferRouterOutputs<AppRouter>["item"]["getAllForCategorySortedByIndex"][number];

export const SettingsPage = () => {
  const { activePlace } = usePlaceContext();
  const [categoryIndexes, setCategoryIndexes] = useState<CategoryIndex[]>([]);
  const [chosenCategory, setChosenCategory] = useState<
    CategoryIndex["category"] | null
  >(null);
  const [itemIndexes, setItemIndexes] = useState<ItemIndex[]>([]);

  const updateCategoryOrderMutation = useMutation(
    trpc.category.updateOrder.mutationOptions(),
  );

  const updateItemOrderMutation = useMutation(
    trpc.item.updateOrder.mutationOptions(),
  );

  const { data: indexedCategories } = useQuery(
    trpc.category.getAllSortedByIndex.queryOptions(
      {
        placeId: activePlace?.id ?? "",
      },
      {
        enabled: !!activePlace,
      },
    ),
  );

  const { data: indexedItems, isLoading: isLoadingItems } = useQuery(
    trpc.item.getAllForCategorySortedByIndex.queryOptions(
      {
        categoryId: chosenCategory?.id ?? null,
      },
      {
        enabled: !!chosenCategory,
      },
    ),
  );

  useEffect(() => {
    if (indexedCategories) {
      setCategoryIndexes(indexedCategories);
    }
  }, [indexedCategories]);

  useEffect(() => {
    if (indexedItems) {
      setItemIndexes(indexedItems);
    } else {
      setItemIndexes([]);
    }
  }, [indexedItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategoryIndexes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        updateCategoryOrderMutation.mutateAsync(
          {
            placeId: activePlace!.id,
            newCategoryOrder: newOrder.map((catIndex) => ({
              indexId: catIndex.id,
              categoryId: catIndex.category.id,
            })),
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.category.getAllSortedByIndex.queryKey(),
              });
              toast.success("Category order updated.");
            },
            onError: (error) => {
              console.error("Failed to update category order:", error);
              toast.error("Failed to update category order. Please try again.");
            },
          },
        );

        return newOrder;
      });
    }
  };

  const handleItemDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItemIndexes((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);

      if (chosenCategory?.id) {
        updateItemOrderMutation.mutateAsync(
          {
            categoryId: chosenCategory.id,
            newItemOrder: newOrder.map((idx) => ({
              indexId: idx.id,
              itemId: idx.item.id,
            })),
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.item.getAllForCategorySortedByIndex.queryKey({
                  categoryId: chosenCategory.id,
                }),
              });
              toast.success("Item order updated.");
            },
            onError: (error) => {
              console.error("Failed to update item order:", error);
              toast.error("Failed to update item order. Please try again.");
            },
          },
        );
      }

      return newOrder;
    });
  };

  return (
    <div>
      <main className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Category Order</CardTitle>
            <CardDescription>
              Reorder your categories as you want them to appear on your menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categoryIndexes.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {categoryIndexes?.map((categoryIndex) => (
                  <SortableCategoryItem
                    key={categoryIndex.id}
                    categoryIndex={categoryIndex}
                    setChosenCategory={setChosenCategory}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
        {chosenCategory && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{chosenCategory?.name}</CardTitle>
              <CardDescription>
                Reorder your {chosenCategory?.name} as you want them to appear
                on your menu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleItemDragEnd}
              >
                <SortableContext
                  items={itemIndexes.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {isLoadingItems
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-10" />
                      ))
                    : itemIndexes.map((itemIndex) => (
                        <SortableMenuItem
                          key={itemIndex.id}
                          itemIndex={itemIndex}
                        />
                      ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

const SortableCategoryItem = ({
  categoryIndex,
  setChosenCategory,
}: {
  categoryIndex: CategoryIndex;
  setChosenCategory: React.Dispatch<
    React.SetStateAction<CategoryIndex["category"] | null>
  >;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryIndex.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Item variant="outline" size="sm">
        <button
          className="cursor-grab px-2 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="text-muted-foreground h-4 w-4" />
        </button>
        <ItemContent>
          <ItemTitle>{categoryIndex?.category?.name}</ItemTitle>
        </ItemContent>
        <ItemActions>
          {/* Add an icon here that will reveal the chosen categories items */}
          <Button
            size={"icon-sm"}
            variant={"ghost"}
            onClick={() => setChosenCategory(categoryIndex.category)}
          >
            <ChevronRight />
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
};

const SortableMenuItem = ({ itemIndex }: { itemIndex: ItemIndex }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemIndex.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Item variant="outline" size="sm">
        <ItemContent>
          <ItemTitle>{itemIndex?.item?.name}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <button
            className="cursor-grab px-2 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="text-muted-foreground h-4 w-4" />
          </button>
        </ItemActions>
      </Item>
    </div>
  );
};
