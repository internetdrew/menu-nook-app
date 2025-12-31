import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../ui/skeleton";

const ItemsCard = ({ activeMenuId }: { activeMenuId: string }) => {
  const { data: count, isLoading } = useQuery(
    trpc.menuCategoryItem.getCountByMenuId.queryOptions(
      {
        menuId: activeMenuId,
      },
      {
        enabled: !!activeMenuId,
      },
    ),
  );

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm">Items Managed</CardTitle>
        {/* <Icon className="text-muted-foreground size-3" /> */}
      </CardHeader>
      <CardContent className="mt-auto">
        {isLoading ? (
          <Skeleton className="h-8 w-8" />
        ) : (
          <p className="text-2xl font-semibold">{count}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ItemsCard;
