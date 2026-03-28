import { Skeleton } from "./ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton">
      <main>
        <div className="my-4 flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-40 rounded-sm bg-neutral-200" />
          <Skeleton className="h-10 w-28 rounded-md bg-neutral-200" />
        </div>

        <div className="my-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-xl border p-6">
            <Skeleton className="h-4 w-28 bg-neutral-200" />
            <Skeleton className="mt-6 h-8 w-8 bg-neutral-200" />
          </div>
          <div className="rounded-xl border p-6">
            <Skeleton className="h-4 w-24 bg-neutral-200" />
            <Skeleton className="mt-6 h-8 w-8 bg-neutral-200" />
          </div>
        </div>
      </main>
    </div>
  );
}
