import { Skeleton } from "../ui/skeleton";

const MenuCategoriesSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Loading menu categories"
      data-testid="menu-categories-skeleton"
      className="space-y-4"
    >
      <span className="sr-only">Loading menu categories</span>
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
  );
};

export default MenuCategoriesSkeleton;
