import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ClipboardPen, GripVertical, Info, Trash } from "lucide-react";
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
import FormDialog from "@/components/dialogs/FormDialog";
import ItemForm from "@/components/forms/ItemForm";
import DeleteItemAlertDialog from "@/components/dialogs/DeleteItemAlertDialog";
import { useParams } from "react-router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ItemIndex =
  inferRouterOutputs<AppRouter>["menuCategoryItem"]["getSortedForCategory"][number];

export const CategoryItemsPage = () => {
  const { activeMenu } = useMenuContext();
  const { categoryId } = useParams<{ categoryId: string }>();
  const parsedCategoryId = categoryId ? parseInt(categoryId, 10) : null;

  const { data: category, isLoading: isLoadingCategory } = useQuery(
    trpc.menuCategory.getById.queryOptions(
      { categoryId: parsedCategoryId ?? 0 },
      { enabled: parsedCategoryId != null && !!activeMenu },
    ),
  );

  const [itemIndexes, setItemIndexes] = useState<ItemIndex[]>([]);
  const [itemForEdit, setItemForEdit] = useState<ItemIndex["item"] | null>(
    null,
  );
  const [itemForDelete, setItemForDelete] = useState<ItemIndex["item"] | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  const updateItemOrderMutation = useMutation(
    trpc.menuCategoryItem.updateSortOrder.mutationOptions(),
  );

  const { data: indexedItems, isLoading: isLoadingItems } = useQuery(
    trpc.menuCategoryItem.getSortedForCategory.queryOptions(
      {
        categoryId: parsedCategoryId,
      },
      {
        enabled: !!parsedCategoryId,
      },
    ),
  );

  useEffect(() => {
    setItemIndexes(indexedItems ?? []);
  }, [indexedItems, parsedCategoryId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleItemDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItemIndexes((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);

      if (category?.id) {
        updateItemOrderMutation.mutateAsync(
          {
            categoryId: category.id,
            newItemOrder: newOrder.map((idx) => ({
              indexId: idx.id,
              itemId: idx.item.id,
            })),
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.menuCategoryItem.getSortedForCategory.queryKey({
                  categoryId: category.id,
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

  const handleEditButtonClick = (item: ItemIndex["item"]) => {
    setItemForEdit(item);
    setIsItemDialogOpen(true);
  };

  const handleDeleteButtonClick = (item: ItemIndex["item"]) => {
    setItemForDelete(item);
    setIsDeleteDialogOpen(true);
  };

  if (!category && !isLoadingCategory) {
    return <div className="p-10">Category not found.</div>;
  }

  return (
    <div className="pb-10">
      <main>
        <div className="my-4 flex items-center">
          {isLoadingCategory ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <>
              <h1 className="font-medium">{category?.name}</h1>
              {category?.description && (
                <Popover>
                  <PopoverTrigger>
                    <Info className="ml-1 size-3" />
                  </PopoverTrigger>
                  <PopoverContent className="text-sm">
                    {category?.description}
                  </PopoverContent>
                </Popover>
              )}
            </>
          )}
          {isLoadingCategory ? (
            <Skeleton className="ml-auto h-8 w-24" />
          ) : (
            <Button
              className="ml-auto"
              onClick={() => {
                setItemForEdit(null);
                setIsItemDialogOpen(true);
              }}
            >
              Add Item
            </Button>
          )}
        </div>
        {indexedItems?.length === 0 && !isLoadingItems && (
          <div className="mt-12 flex flex-col items-center justify-center p-10">
            <p className="text-muted-foreground text-center text-lg">
              Start adding items to this category to populate your menu.
            </p>
          </div>
        )}
        <div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleItemDragEnd}
          >
            <SortableContext
              items={itemIndexes.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {isLoadingItems
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-16 lg:max-w-1/2" />
                    ))
                  : itemIndexes.map((itemIndex) => (
                      <SortableMenuItem
                        key={itemIndex.id}
                        itemIndex={itemIndex}
                        onEditButtonClick={handleEditButtonClick}
                        onDeleteButtonClick={handleDeleteButtonClick}
                      />
                    ))}
              </div>
            </SortableContext>
          </DndContext>
          {category && (
            <FormDialog
              title={itemForEdit ? `Edit ${itemForEdit.name}` : `Add Item`}
              description={`Add a new item to ${category?.name}.`}
              isDialogOpen={isItemDialogOpen}
              setIsDialogOpen={setIsItemDialogOpen}
              formComponent={
                <ItemForm
                  item={itemForEdit}
                  chosenCategory={category}
                  onSuccess={() => setIsItemDialogOpen(false)}
                />
              }
            />
          )}
        </div>

        {itemForDelete && (
          <DeleteItemAlertDialog
            item={itemForDelete}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          />
        )}
      </main>
    </div>
  );
};

const SortableMenuItem = ({
  itemIndex,
  onEditButtonClick,
  onDeleteButtonClick,
}: {
  itemIndex: ItemIndex;
  onEditButtonClick: (item: ItemIndex["item"]) => void;
  onDeleteButtonClick: (item: ItemIndex["item"]) => void;
}) => {
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
      <Item variant="outline" size="sm" className="max-w-full lg:max-w-1/2">
        <ItemMedia variant="icon" className="my-auto border-0 bg-transparent">
          <button
            className="cursor-grab px-2 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="text-muted-foreground h-4 w-4" />
          </button>
        </ItemMedia>
        <ItemContent className="select-none">
          <span className="flex items-center">
            <ItemTitle>{itemIndex?.item?.name}</ItemTitle>
            {itemIndex?.item?.description && (
              <Popover>
                <PopoverTrigger>
                  <Info className="ml-1 size-3" />
                </PopoverTrigger>
                <PopoverContent className="text-sm">
                  {itemIndex?.item?.description}
                </PopoverContent>
              </Popover>
            )}
          </span>
          <span className="text-muted-foreground mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(itemIndex?.item?.price ?? 0)}
          </span>
        </ItemContent>
        <ItemActions>
          <Button
            aria-label="Edit item"
            size={"icon-sm"}
            variant={"ghost"}
            onClick={() => onEditButtonClick(itemIndex.item)}
          >
            <ClipboardPen />
          </Button>
          <Button
            aria-label="Delete item"
            size={"icon-sm"}
            variant={"ghost"}
            className="text-red-600 hover:text-red-600"
            onClick={() => onDeleteButtonClick(itemIndex.item)}
          >
            <Trash />
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
};
