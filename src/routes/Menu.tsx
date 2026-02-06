import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { linkClasses } from "@/constants";
import { createSlug } from "@/utils/createSlug";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { NotFound } from "./NotFound";
import MenuUnavailable from "../components/MenuUnavailable";
import { toast } from "sonner";

const liveSiteUrl = import.meta.env.VITE_APP_DOMAIN;

export const Menu = () => {
  const { menuId } = useParams<{ menuId: string }>();
  const { hash, pathname } = useLocation();

  const isPreview = pathname.startsWith("/preview/");

  const {
    data: menu,
    isLoading,
    error,
  } = useQuery(
    isPreview
      ? trpc.menu.getPreview.queryOptions(
          { menuId: menuId ?? "" },
          { enabled: !!menuId },
        )
      : trpc.menu.getPublic.queryOptions(
          { menuId: menuId ?? "" },
          { enabled: !!menuId },
        ),
  );

  const stripeCheckoutMutation = useMutation(
    trpc.stripe.createCheckoutSession.mutationOptions(),
  );

  const { data: subscription } = useQuery(
    trpc.subscription.getForBusiness.queryOptions(
      {
        businessId: menu?.business_id ?? "",
      },
      {
        enabled: !!menu?.business_id,
      },
    ),
  );

  const subscriptionIsActive =
    subscription?.status === "active" &&
    new Date(subscription.current_period_end) > new Date();

  const navRef = useRef<HTMLElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollToTop(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(nav);
    return () => observer.disconnect();
  }, [menu]);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  };

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        el.scrollIntoView({
          behavior: prefersReducedMotion ? "instant" : "smooth",
          block: "start",
        });
      }
    }
  }, [hash]);

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
        <div className="sticky top-16 z-10 rounded-lg border-b bg-neutral-600/5 py-4 text-center text-sm backdrop-blur-sm">
          <div className="mx-auto flex max-w-screen-sm flex-col items-center justify-center gap-2">
            <span className="font-medium">
              Your customers can't see this menu.
            </span>
            {subscriptionIsActive ? (
              <a href={`${liveSiteUrl}/${menu.id}`} className={linkClasses}>
                View Live Menu
              </a>
            ) : (
              <Button
                size={"sm"}
                onClick={handleSubscribe}
                disabled={
                  stripeCheckoutMutation.isPending ||
                  stripeCheckoutMutation.isSuccess
                }
              >
                {stripeCheckoutMutation.isPending && <Spinner />} Subscribe to
                publish
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
        <nav
          ref={navRef}
          className="my-8 flex flex-wrap items-center justify-center gap-4"
        >
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

      <Button
        onClick={scrollToTop}
        size="icon"
        className={`fixed right-4 bottom-4 rounded-full shadow-lg motion-safe:transition-transform motion-safe:duration-300 ${
          showScrollToTop ? "translate-x-0" : "translate-x-20"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
};
