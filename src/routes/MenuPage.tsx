import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { usePlaceContext } from "@/contexts/ActivePlaceContext";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronRightIcon,
  ClipboardPen,
  GripVertical,
  Trash,
} from "lucide-react";
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
import { Link } from "react-router";
import FormDialog from "@/components/dialogs/FormDialog";
import ItemForm from "@/components/forms/ItemForm";
import ManageCategoriesDropdown from "@/components/ManageCategoriesDropdown";
import DeleteItemAlertDialog from "@/components/dialogs/DeleteItemAlertDialog";
import CategoryForm from "@/components/forms/CategoryForm";

type CategoryIndex =
  inferRouterOutputs<AppRouter>["category"]["getAllSortedByIndex"][number];
type ItemIndex =
  inferRouterOutputs<AppRouter>["item"]["getAllForCategorySortedByIndex"][number];

export const MenuPage = () => {
  const { activePlace } = usePlaceContext();
  const [categoryIndexes, setCategoryIndexes] = useState<CategoryIndex[]>([]);
  const [chosenCategory, setChosenCategory] = useState<
    CategoryIndex["category"] | null
  >(null);
  const [itemIndexes, setItemIndexes] = useState<ItemIndex[]>([]);
  const [itemForDelete, setItemForDelete] = useState<ItemIndex["item"] | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemForEdit, setItemForEdit] = useState<ItemIndex["item"] | null>(
    null,
  );
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [renderAddCategoryDialog, setRenderAddCategoryDialog] = useState(false);

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

  const handleEditButtonClick = (item: ItemIndex["item"]) => {
    setItemForEdit(item);
    setIsItemDialogOpen(true);
  };

  const handleDeleteButtonClick = (item: ItemIndex["item"]) => {
    setItemForDelete(item);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div>
      <main>
        <Item
          variant={"outline"}
          size={"sm"}
          asChild
          className="my-4 ml-auto flex w-fit"
        >
          <Link
            to={`/menu/${activePlace?.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <ItemContent>
              <ItemTitle>Visit live menu</ItemTitle>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4 text-pink-600" />
            </ItemActions>
          </Link>
        </Item>
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <>
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  These are the categories you'll use to organize your menu
                  items.
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
              <CardFooter>
                <Button
                  className="ml-auto"
                  onClick={() => setRenderAddCategoryDialog(true)}
                >
                  Add Category
                </Button>
              </CardFooter>
            </Card>
            <FormDialog
              title="Add Category"
              description="Add a new category to your to list items under."
              isDialogOpen={renderAddCategoryDialog}
              setIsDialogOpen={setRenderAddCategoryDialog}
              formComponent={
                <CategoryForm
                  onSuccess={() => {
                    setRenderAddCategoryDialog(false);
                  }}
                />
              }
            />
          </>
          {chosenCategory && (
            <>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{chosenCategory?.name}</CardTitle>
                  <CardDescription>
                    Reorder your {chosenCategory?.name} as you want them to
                    appear on your menu.
                  </CardDescription>
                  <CardAction>
                    <ManageCategoriesDropdown category={chosenCategory} />
                  </CardAction>
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
                        ? Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-10" />
                          ))
                        : itemIndexes.map((itemIndex) => (
                            <SortableMenuItem
                              key={itemIndex.id}
                              itemIndex={itemIndex}
                              onEditButtonClick={handleEditButtonClick}
                              onDeleteButtonClick={handleDeleteButtonClick}
                            />
                          ))}
                    </SortableContext>
                  </DndContext>
                </CardContent>
                <CardFooter>
                  <Button
                    className="ml-auto"
                    onClick={() => {
                      setItemForEdit(null);
                      setIsItemDialogOpen(true);
                    }}
                  >
                    Add Item
                  </Button>
                </CardFooter>
              </Card>
              <FormDialog
                title={itemForEdit ? `Edit ${itemForEdit.name}` : `Add Item`}
                description={`Add a new item to ${chosenCategory?.name}.`}
                isDialogOpen={isItemDialogOpen}
                setIsDialogOpen={setIsItemDialogOpen}
                formComponent={
                  <ItemForm
                    item={itemForEdit}
                    chosenCategory={chosenCategory}
                    onSuccess={() => setIsItemDialogOpen(false)}
                  />
                }
              />
            </>
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
      <Item variant="outline" size="sm">
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
          <span className="flex items-center gap-4">
            <ItemTitle>{itemIndex?.item?.name}</ItemTitle>{" "}
            <span className="text-muted-foreground">
              ${itemIndex?.item?.price.toFixed(2)}
            </span>
          </span>
          {itemIndex?.item?.description && (
            <ItemDescription>{itemIndex?.item?.description}</ItemDescription>
          )}
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
            className="text-red-600"
            onClick={() => onDeleteButtonClick(itemIndex.item)}
          >
            <Trash />
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
};
