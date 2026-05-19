import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-[#e9dfd6]/80 dark:bg-[#3d3832]",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
