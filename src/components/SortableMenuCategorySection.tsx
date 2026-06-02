import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Accordion from "@radix-ui/react-accordion";
import {
  ChevronDown,
  Ellipsis,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { accordionEaseOut, sortableTransition } from "@/constants";
import { SortableMenuItemRow } from "./SortableMenuItemRow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type { MenuPreviewCategory } from "@/types/menu";

type MenuCategory = MenuPreviewCategory;

const getCategorySortableId = (categoryId: number) => `category-${categoryId}`;

export function SortableMenuCategorySection({
  category,
  isOpen,
  onAddItem,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
}: {
  category: MenuCategory;
  isOpen: boolean;
  onAddItem: (category: MenuCategory) => void;
  onDeleteCategory: (category: MenuCategory) => void;
  onEditItem: (
    item: MenuCategory["items"][number],
    category: MenuCategory,
  ) => void;
  onDeleteItem: (
    item: MenuCategory["items"][number],
    category: MenuCategory,
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getCategorySortableId(category.id),
    data: { type: "category", categoryId: category.id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? transition : (transition ?? sortableTransition),
    boxShadow: isDragging
      ? "0 10px 28px rgba(40, 21, 19, 0.16)"
      : "0 1px 3px rgba(40, 21, 19, 0.08)",
    opacity: isDragging ? 0.9 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 20 : 0,
  };

  return (
    <Accordion.Item
      ref={setNodeRef}
      style={style}
      value={String(category.id)}
      className={`overflow-hidden rounded-lg border border-neutral-200 bg-white transition-colors ${
        isDragging ? "border-neutral-300" : ""
      }`}
    >
      <Accordion.Header
        className={`m-0 flex items-center pr-2 pl-3 ${
          isOpen ? "border-b border-neutral-200/60" : ""
        }`}
      >
        <div
          className="group flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 py-3 text-left active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${category.name}`}
        >
          <span className="grid size-3.5 shrink-0 place-items-center">
            <GripVertical className="size-4 shrink-0 text-[#b6aaa1] transition-colors duration-150 group-hover:text-[#907f75]" />
          </span>
          <div className="flex min-w-0 flex-1 items-center select-none">
            <h2 className="inline truncate text-sm font-semibold text-[#281513]">
              {category.name}
            </h2>
            <span className="ml-2 shrink-0 text-[11px] font-medium text-[#8d7f78]">
              {category.items.length}{" "}
              {category.items.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        <Accordion.Trigger asChild>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center text-[#78665e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${category.name}`}
          >
            <motion.span
              initial={false}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.16, ease: accordionEaseOut }}
              className="grid size-4 origin-center place-items-center"
              style={{ transformOrigin: "50% 50%", willChange: "transform" }}
            >
              <ChevronDown className="size-4" />
            </motion.span>
          </button>
        </Accordion.Trigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center text-[#78665e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
              aria-label={`Open actions for ${category.name}`}
            >
              <Ellipsis className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onAddItem(category)}>
                <Plus />
                Add item
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteCategory(category)}
              >
                <Trash2 />
                Delete category
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Accordion.Header>

      <AnimatePresence initial={false}>
        {isOpen && (
          <Accordion.Content forceMount asChild>
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { height: "auto" },
                closed: { height: 0 },
              }}
              className="overflow-hidden"
            >
              <motion.div
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -4 },
                }}
              >
                {category.items.length === 0 ? (
                  <div className="flex items-center justify-between gap-3 bg-white p-3 text-xs">
                    <p className="text-[#7d6b62]">No items in this category.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onAddItem(category)}
                    >
                      Add Item
                    </Button>
                  </div>
                ) : (
                  <SortableContext
                    items={category.items.map((item) => `item-${item.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div>
                      {category.items.map((item) => (
                        <SortableMenuItemRow
                          key={item.id}
                          item={item}
                          categoryId={category.id}
                          onEditItem={(selectedItem) =>
                            onEditItem(selectedItem, category)
                          }
                          onDeleteItem={(selectedItem) =>
                            onDeleteItem(selectedItem, category)
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </motion.div>
            </motion.div>
          </Accordion.Content>
        )}
      </AnimatePresence>
    </Accordion.Item>
  );
}
