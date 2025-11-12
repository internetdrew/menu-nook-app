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
import { CircleSlash, MoreHorizontal, NotepadText } from "lucide-react";
import { formatDistance } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server";
// import { Badge } from "../ui/badge.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover.tsx";

export type Item =
  inferRouterOutputs<AppRouter>["item"]["getAllByRestaurant"][number];

export function getItemColumns(
  handleEditButtonClick: (item: Item) => void,
  handleDeleteButtonClick: (item: Item) => void,
): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "name",
      header: () => <div className="text-left">Name</div>,
      cell: ({ row }) => {
        return (
          <div className="text-left font-mono text-sm">
            {row.getValue("name")}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: () => <div className="text-center">Description</div>,
      cell: ({ row }) => {
        return (
          <div className="text-center">
            {row.getValue("description") ? (
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <NotepadText className="mx-auto size-4" />
                </PopoverTrigger>
                <PopoverContent className="text-sm">
                  {row.getValue("description")}
                </PopoverContent>
              </Popover>
            ) : (
              <CircleSlash className="text-muted-foreground mx-auto size-4" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: () => <div className="text-center">Category</div>,
      cell: ({ row }) => {
        const category = row.original.category;
        return (
          <div className="text-left font-mono text-sm">{category?.name}</div>
        );
      },
    },
    {
      accessorKey: "price",
      header: () => <div className="text-center">Price</div>,
      cell: ({ row }) => {
        return (
          <div className="text-left font-mono text-sm">
            {row.getValue("price")}
          </div>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: () => <div className="text-center">Last Update</div>,
      cell: ({ row }) => {
        const lastUpdatedAt = row.original.updated_at;
        const relativeTime = formatDistance(lastUpdatedAt, new Date(), {
          addSuffix: true,
        });

        return (
          <div className="mx-auto max-w-40 truncate text-center font-mono text-sm">
            {relativeTime}
          </div>
        );
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
            <DropdownMenuContent align="end" className="font-mono">
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
