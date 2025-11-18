import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";

const PublicMenu = () => {
  const { placeId } = useParams<{ placeId: string }>();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [hash]);

  const createSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, "-");
  };

  const {
    data: menu,
    isLoading,
    error,
  } = useQuery(
    trpc.menu.getForPlace.queryOptions(
      {
        placeId: placeId ?? "",
      },
      {
        enabled: !!placeId,
      },
    ),
  );

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 py-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="container mx-auto py-8">
        <p>Menu not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="bg-background fixed top-0 right-0 left-0 mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-4">
        <h1 className="text-lg font-semibold">{menu.place.name}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Menu Categories">
            <Menu />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Categories</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {menu.categories.map((category) => (
              <DropdownMenuItem asChild key={category.id}>
                <Link to={{ hash: `#${createSlug(category.name)}` }}>
                  {category.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <main className="mx-auto w-full max-w-screen-sm px-4 py-8">
        {menu.categories.length === 0 ? (
          <p>No categories available.</p>
        ) : (
          menu.categories.map((category) => (
            <section key={category.id} className="mt-12">
              <h2
                id={createSlug(category.name)}
                className="mb-4 scroll-mt-20 border-b pb-3 text-lg font-semibold"
              >
                {category.name}
              </h2>
              {category.items.length === 0 ? (
                <p>No items in this category.</p>
              ) : (
                <ul className="space-y-6">
                  {category.items.map((item) => (
                    <li key={item.id} className="">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-medium">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground max-w-md text-sm">
                          {item.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))
        )}
      </main>
      <footer className="mt-auto">
        <div className="text-muted-foreground mx-auto my-8 max-w-screen-sm px-4 text-center text-sm">
          <span>
            Powered by{" "}
            <Link
              to="https://menulink.com"
              className="text-pink-600 underline-offset-4 transition-all duration-200 hover:underline"
            >
              MenuLink
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default PublicMenu;
