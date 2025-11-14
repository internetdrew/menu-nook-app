import { usePlaceContext } from "@/contexts/ActivePlaceContext";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Item, ItemGroup } from "@/components/ui/item";

const Menu = () => {
  const { activePlace } = usePlaceContext();

  const { data: categories } = useQuery(
    trpc.category.getAllByPlace.queryOptions(
      {
        placeId: activePlace?.id ?? "",
      },
      {
        enabled: !!activePlace,
      },
    ),
  );

  return (
    <div>
      <div className="flex">
        <Item variant="outline" size="sm" asChild>
          <Link
            to={`/menu/${activePlace?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-pink-600 hover:text-pink-700 hover:underline hover:underline-offset-4"
          >
            View Public Menu
          </Link>
        </Item>
      </div>

      <h1 className="mt-4 text-xl font-semibold">Menu</h1>
      <p className="text-muted-foreground text-sm">
        Reorder your categories and items as you'd like them to appear on the
        public menu.
      </p>
      <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories?.map((category) => (
          <li key={category.id}>
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ItemGroup className="space-y-4 text-sm">
                  {category.items.map((item) => (
                    <Item id={item.id.toString()} variant="outline" size="sm">
                      <div className="flex w-full justify-between">
                        <span className="font-semibold">{item.name}</span>
                        <span className="font-medium">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {item.description}
                      </span>
                    </Item>
                  ))}
                </ItemGroup>
              </CardContent>
              <CardFooter className="text-shadow-muted-foreground mt-auto text-xs">
                Reorder your items as you'd like them to appear on the public
                menu.
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Menu;
