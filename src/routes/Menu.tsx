import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { linkClasses } from "@/constants";
import { createSlug } from "@/utils/createSlug";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { NotFound } from "./NotFound";
import MenuUnavailable from "../components/MenuUnavailable";
import { toast } from "sonner";

interface MenuProps {
  isPreview?: boolean;
}

const liveSiteUrl = import.meta.env.VITE_APP_DOMAIN;

export const Menu = ({ isPreview = false }: MenuProps) => {
  const { menuId } = useParams<{ menuId: string }>();
  const { hash } = useLocation();

  const stripeCheckoutMutation = useMutation(
    trpc.stripe.createCheckoutSession.mutationOptions(),
  );

  const { data: subscription } = useQuery(
    trpc.subscription.getForUser.queryOptions(),
  );

  const subscriptionIsActive =
    subscription?.status === "active" &&
    new Date(subscription.current_period_end) > new Date();

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
    trpc.menu.getById.queryOptions(
      {
        menuId: menuId ?? "",
      },
      {
        enabled: !!menuId,
      },
    ),
  );

  const categoriesWithItems = menu?.menu_categories.filter(
    (category) => category.items && category.items.length > 0,
  );

  const handleSubscribe = async () => {
    await stripeCheckoutMutation.mutateAsync(undefined, {
      onSuccess: (data) => {
        window.location.assign(data.url);
      },
      onError: (error) => {
        console.error("Error creating checkout session:", error);
        toast.error("Error creating checkout session: ");
      },
    });
  };

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

  if (!menu || error) {
    return (
      <NotFound
        title="Menu Not Found"
        message="The menu you're looking for does not exist."
        href="/"
        hrefText="Go back to Home"
      />
    );
  }

  if (!isPreview && menu && !subscriptionIsActive) {
    return <MenuUnavailable placeName={menu.name} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {isPreview && (
        <div className="sticky top-0 z-10 border-b border-yellow-300 bg-yellow-100 py-2 text-center text-sm text-yellow-800">
          <div className="mx-auto flex max-w-screen-sm flex-col items-center justify-center gap-2">
            <span>
              This is a preview. To enable the live menu, please subscribe.
            </span>
            {subscriptionIsActive ? (
              <a href={`${liveSiteUrl}/${menu.id}`} className={linkClasses}>
                View Live Menu
              </a>
            ) : (
              <Button
                type="submit"
                variant="outline"
                onClick={handleSubscribe}
                className="text-xs"
                disabled={
                  stripeCheckoutMutation.isPending ||
                  stripeCheckoutMutation.isSuccess
                }
              >
                {stripeCheckoutMutation.isPending && <Spinner />} Subscribe
              </Button>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <h1 className="text-center text-xl font-semibold">
          {menu.business.name}
        </h1>
        <h2 className="text-muted-foreground mt-2 text-center">{menu.name}</h2>
        <nav className="my-8 flex flex-wrap items-center justify-center gap-4">
          <ul className="flex flex-wrap items-center justify-center gap-4">
            {categoriesWithItems?.map((category) => {
              return (
                <li key={category.id}>
                  <Link
                    replace
                    to={{ hash: `#${createSlug(category.name)}` }}
                    className="underline-offset-4 duration-300 hover:underline"
                  >
                    {category.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {categoriesWithItems?.length === 0 ? (
          <p className="mt-16 text-center">No categories available.</p>
        ) : (
          categoriesWithItems?.map((category) => (
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
                {category.items?.map((item) => (
                  <li key={item.id}>
                    <div className="flex justify-between">
                      <span>{item.name}</span>
                      <span>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(item.price)}
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
            </section>
          ))
        )}
      </main>
      <footer className="mt-auto">
        <div className="text-muted-foreground mx-auto my-8 max-w-screen-sm px-4 text-center text-sm">
          <span>
            Powered by{" "}
            <a href="https://menunook.com" className={linkClasses}>
              MenuNook
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};
