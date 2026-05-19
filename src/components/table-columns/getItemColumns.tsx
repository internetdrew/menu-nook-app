import type { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";
import { Button } from "../ui/button.tsx";
import { MoreHorizontal, NotepadText } from "lucide-react";
import { formatDistance } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover.tsx";
import capitalize from "@/utils/capitalize.ts";
import type { ItemTableRow } from "@/types/menu";

export type Item = ItemTableRow;

export function getItemColumns(
  handleEditButtonClick: (item: Item) => void,
  handleDeleteButtonClick: (item: Item) => void,
): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "name",
      header: () => <div>Name</div>,
      cell: ({ row }) => {
        const description = row.original.description;

        return (
          <div className="flex items-center gap-2">
            <div>{row.getValue("name")}</div>
            {description && (
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <NotepadText className="size-4" />
                </PopoverTrigger>
                <PopoverContent className="text-sm">
                  {description}
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: () => <div>Category</div>,
      cell: ({ row }) => {
        const category = row.original.category;
        return <div className="text-sm">{category?.name}</div>;
      },
    },
    {
      accessorKey: "price",
      header: () => <div>Price</div>,
      cell: ({ row }) => {
        const price = row.original.price;
        return <div>${price.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "updated_at",
      header: () => <div>Last Update</div>,
      cell: ({ row }) => {
        const lastUpdatedAt = row.original.updated_at;
        const relativeTime = formatDistance(lastUpdatedAt, new Date(), {
          addSuffix: true,
        });

        return <div>{capitalize(relativeTime)}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  handleEditButtonClick(row.original);
                }}
              >
                Edit item
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleDeleteButtonClick(row.original);
                }}
              >
                Delete item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
