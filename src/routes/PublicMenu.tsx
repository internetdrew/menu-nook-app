import { Skeleton } from "@/components/ui/skeleton";
import { createSlug } from "@/utils/createSlug";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
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
      <div className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <Skeleton className="mx-auto mb-6 h-8 w-1/4" />
        <Skeleton className="mx-auto mt-8 h-8 w-1/4" />
        <Skeleton className="mt-16 mb-2 h-8 w-1/4" />
        <Skeleton className="h-8 w-1/2" />
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
      <main className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <h1 className="text-center text-xl font-medium">{menu.place.name}</h1>
        <nav className="my-8 flex flex-wrap items-center justify-center gap-4">
          <ul className="flex flex-wrap items-center justify-center gap-4">
            {menu.categories.map((category) => (
              <li key={category.id}>
                <Link
                  replace
                  to={{ hash: `#${createSlug(category.name)}` }}
                  className="underline-offset-4 duration-300 hover:underline"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {menu.categories.length === 0 ? (
          <p className="mt-16 text-center">No categories available.</p>
        ) : (
          menu.categories.map((category) => {
            if (category.items.length > 0)
              return (
                <section key={category.id} className="mt-16">
                  <h2
                    id={createSlug(category.name)}
                    className="scroll-mt-20 text-lg font-medium"
                  >
                    {category.name}
                  </h2>
                  <p className="text-muted-foreground mb-4 border-b pb-3 text-sm">
                    {category.description}
                  </p>

                  <ul className="space-y-6">
                    {category.items.map((item) => (
                      <li key={item.id} className="">
                        <div className="flex justify-between">
                          <span className="">{item.name}</span>
                          <span className="">${item.price.toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <p className="text-muted-foreground max-w-md text-sm">
                            {item.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
          })
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
              MenuNook
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default PublicMenu;
