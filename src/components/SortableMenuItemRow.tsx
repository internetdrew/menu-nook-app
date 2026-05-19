import { sortableTransition } from "@/constants";
import type { MenuPreviewItem } from "@/types/menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, GripVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type MenuItem = MenuPreviewItem;

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function SortableMenuItemRow({
  item,
  categoryId,
  onEditItem,
  onDeleteItem,
}: {
  item: MenuItem;
  categoryId: number;
  onEditItem: (item: MenuItem, categoryId: number) => void;
  onDeleteItem: (item: MenuItem, categoryId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `item-${item.id}`,
    data: { type: "item", categoryId, itemId: item.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : (transition ?? sortableTransition),
    boxShadow: isDragging
      ? "0 7px 20px rgba(40, 21, 19, 0.15)"
      : "0 0 0 rgba(40, 21, 19, 0)",
    opacity: isDragging ? 0.94 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center bg-white py-2.5 pr-2 pl-3 text-sm font-medium transition-colors select-none ${
        isDragging ? "rounded-md" : ""
      }`}
    >
      <button
        type="button"
        className="-my-2 -ml-2 grid size-8 shrink-0 cursor-grab touch-none place-items-center active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${item.name}`}
      >
        <GripVertical className="size-4 shrink-0 text-neutral-400/70 transition-colors duration-150 hover:text-neutral-500" />
      </button>

      <div className="flex flex-1 items-center gap-1.5">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.name}
            draggable={false}
            className="pointer-events-none size-8 shrink-0 rounded-md object-cover"
          />
        )}
        <div className="pointer-events-none min-w-0 flex-1">
          <h3 className="min-w-0 truncate text-[#281513]">{item.name}</h3>
          <p className="line-clamp-1 truncate text-xs font-normal text-[#7d6b62]">
            {item.tagline || item.description || "No description added"}
          </p>
        </div>
      </div>
      <span className="pointer-events-none mr-1 ml-2 w-12 shrink-0 text-right text-xs text-[#281513] tabular-nums">
        {priceFormatter.format(item.price)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="grid size-7 place-items-center"
            aria-label={`Open actions for ${item.name}`}
          >
            <Ellipsis className="size-4 text-neutral-400/70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onEditItem(item, categoryId)}>
              <Pencil />
              Edit item
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteItem(item, categoryId)}
            >
              <Trash2 />
              Delete item
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
