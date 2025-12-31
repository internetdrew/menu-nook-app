import DeleteCategoryAlertDialog from "@/components/dialogs/DeleteCategoryAlertDialog";
import FormDialog from "@/components/dialogs/FormDialog";
import CategoryForm from "@/components/forms/CategoryForm";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { ClipboardPen, GripVertical, Info, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppRouter } from "server";
import { toast } from "sonner";
import { Link } from "react-router";

export type CategoryIndex =
  inferRouterOutputs<AppRouter>["menuCategory"]["getAllSortedByIndex"][number];

export const CategoriesPage = () => {
  const [renderCategoryDialog, setRenderCategoryDialog] = useState(false);
  const [indexedCategories, setIndexedCategories] = useState<CategoryIndex[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryIndex["category"] | null
  >(null);
  const [renderDeleteCategoryDialog, setRenderDeleteCategoryDialog] =
    useState(false);

  const updateCategoryOrderMutation = useMutation(
    trpc.menuCategory.updateOrder.mutationOptions(),
  );
  const { activeMenu } = useMenuContext();

  const { data, isLoading: isLoadingCategories } = useQuery(
    trpc.menuCategory.getAllSortedByIndex.queryOptions(
      {
        menuId: activeMenu?.id ?? "",
      },
      {
        enabled: !!activeMenu,
      },
    ),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active?.id !== over?.id) {
      setIndexedCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        updateCategoryOrderMutation.mutateAsync(
          {
            menuId: activeMenu?.id ?? null,
            newCategoryOrder: newOrder.map((catIndex) => ({
              indexId: catIndex.id,
              categoryId: catIndex.category.id,
            })),
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.menuCategory.getAllSortedByIndex.queryKey(),
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

  useEffect(() => {
    if (data) {
      setIndexedCategories(data);
    }
  }, [data]);

  return (
    <>
      <div className="my-4 flex items-center">
        <h1 className="font-medium">Categories</h1>
        <Popover>
          <PopoverTrigger>
            <Info className="ml-1 size-3" />
          </PopoverTrigger>
          <PopoverContent className="text-sm">
            Add categories and drag to reorder how they appear on your public
            menu.
          </PopoverContent>
        </Popover>
        <Button
          className="ml-auto"
          onClick={() => {
            setSelectedCategory(null);
            setRenderCategoryDialog(true);
          }}
        >
          Add Category
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={indexedCategories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {isLoadingCategories
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="h-12 max-w-full lg:max-w-1/2"
                  />
                ))
              : indexedCategories.map((index) => (
                  <SortableCategoryItem
                    key={index?.id}
                    categoryIndex={index}
                    onEditButtonClick={() => {
                      setSelectedCategory(index.category);
                      setRenderCategoryDialog(true);
                    }}
                    onDeleteButtonClick={() => {
                      setSelectedCategory(index.category);
                      setRenderDeleteCategoryDialog(true);
                    }}
                  />
                ))}
          </div>
        </SortableContext>
      </DndContext>
      <FormDialog
        title="Add Category"
        description="Add a new category to your to list items under."
        isDialogOpen={renderCategoryDialog}
        setIsDialogOpen={setRenderCategoryDialog}
        formComponent={
          <CategoryForm
            category={selectedCategory}
            onSuccess={() => {
              setRenderCategoryDialog(false);
            }}
          />
        }
      />
      <DeleteCategoryAlertDialog
        category={selectedCategory}
        open={renderDeleteCategoryDialog}
        onOpenChange={setRenderDeleteCategoryDialog}
      />
    </>
  );
};

const SortableCategoryItem = ({
  categoryIndex,
  onEditButtonClick,
  onDeleteButtonClick,
}: {
  categoryIndex: CategoryIndex;
  onEditButtonClick: () => void;
  onDeleteButtonClick: () => void;
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
      <Item variant="outline" size="sm" className="max-w-full lg:max-w-1/2">
        <button
          className="cursor-grab px-2 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="text-muted-foreground h-4 w-4" />
        </button>
        <ItemContent>
          <ItemTitle className="select-none">
            <Link to={`/dashboard/categories/${categoryIndex?.category?.id}`}>
              {categoryIndex?.category?.name}
            </Link>
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button
            aria-label="Edit item"
            size={"icon-sm"}
            variant={"ghost"}
            onClick={onEditButtonClick}
          >
            <ClipboardPen />
          </Button>
          <Button
            aria-label="Delete item"
            size={"icon-sm"}
            variant={"ghost"}
            className="text-red-600 hover:text-red-600"
            onClick={onDeleteButtonClick}
          >
            <Trash />
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
};
