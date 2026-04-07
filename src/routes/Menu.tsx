import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { linkClasses } from "@/constants";
import { createSlug } from "@/utils/createSlug";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { NotFound } from "./NotFound";
import MenuUnavailable from "../components/MenuUnavailable";
import { toast } from "sonner";
import type { AppRouter } from "server";
import type { inferRouterOutputs } from "@trpc/server";
import { Dialog } from "radix-ui";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import MenuPreviewBanner from "@/components/MenuPreviewBanner";
import BusinessLogo from "@/components/BusinessLogo";
import { Badge } from "@/components/ui/badge";

const liveSiteUrl = import.meta.env.VITE_APP_DOMAIN;
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export type MenuItem = NonNullable<
  inferRouterOutputs<AppRouter>["menu"]["getPreview"]
>["menu_categories"][number]["items"][number];

export const Menu = () => {
  const { menuId } = useParams<{ menuId: string }>();
  const { hash, pathname, search } = useLocation();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const isPreview = pathname.startsWith("/preview/");
  const successfulSubscription =
    new URLSearchParams(search).get("success") === "true";

  const {
    data: menu,
    isLoading: menuIsLoading,
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

  const { data: subscription, isLoading: subscriptionIsLoading } = useQuery(
    trpc.subscription.getForMenu.queryOptions(
      {
        menuId: menu?.id ?? "",
      },
      {
        enabled: !!menu?.id,
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
  }, [menu, subscriptionIsActive]);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
    // Reset the hash so clicking the same category link works again
    if (hash) {
      navigate(pathname, { replace: true });
    }
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

  useEffect(() => {
    if (!isPreview || !successfulSubscription || !menu) return;

    toast.success(`${menu.name} is now live.`);
    const nextSearchParams = new URLSearchParams(search);
    nextSearchParams.delete("success");
    navigate(
      {
        pathname,
        search: nextSearchParams.toString()
          ? `?${nextSearchParams.toString()}`
          : "",
        hash,
      },
      { replace: true },
    );
  }, [
    hash,
    isPreview,
    menu,
    navigate,
    pathname,
    search,
    successfulSubscription,
  ]);

  const categoriesWithItems = menu?.menu_categories.filter(
    (category) => category.items && category.items.length > 0,
  );

  if (menuIsLoading || subscriptionIsLoading) {
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
    <div className="relative">
      <MenuPreviewBanner
        subscriptionIsActive={subscriptionIsActive}
        liveSiteUrl={liveSiteUrl}
        menu={menu}
      />

      <LayoutGroup id="menu-items">
        <div className="mx-auto w-full max-w-xl px-4">
          {menu.business.image_url && (
            <BusinessLogo
              imageUrl={menu.business.image_url}
              businessName={menu.business.name}
            />
          )}
          <h1 className="text-center text-xl font-semibold">
            {menu.business.name}
          </h1>
          <h2 className="text-muted-foreground mt-1 text-center text-lg">
            {menu.name}
          </h2>
          <nav
            ref={navRef}
            className="my-6 flex flex-wrap items-center justify-center gap-4"
          >
            <ul className="flex flex-wrap items-center justify-center gap-4">
              {categoriesWithItems?.map((category) => {
                return (
                  <li key={category.id}>
                    <Link
                      replace
                      to={{ hash: `#${createSlug(category.name)}` }}
                      className="underline decoration-neutral-300 underline-offset-4 transition duration-200 hover:decoration-neutral-600"
                    >
                      {category.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Categories and Items */}
          {categoriesWithItems?.length === 0 ? (
            <p className="mt-16 text-center">No categories available.</p>
          ) : (
            categoriesWithItems?.map((category) => (
              <section key={category.id} className="mt-16">
                <h3
                  id={createSlug(category.name)}
                  className="scroll-mt-20 text-lg font-medium"
                >
                  {category.name}
                </h3>
                <p className="text-muted-foreground mb-4 border-b pb-3 text-sm">
                  {category.description}
                </p>

                <motion.ul layout className="space-y-6">
                  {category.items?.map((item) => {
                    const shouldShowDetails =
                      item.description || item.image_url;
                    const isItemSelected = selectedItem?.id === item.id;

                    return (
                      <motion.li
                        layoutId={`item-wrapper-${item.id}`}
                        key={item.id}
                        onClick={() => {
                          if (shouldShowDetails) setSelectedItem(item);
                        }}
                        className={
                          shouldShowDetails ? "group cursor-pointer" : ""
                        }
                      >
                        <div className="flex gap-4">
                          {item.image_url && (
                            <motion.img
                              layoutId={`item-image-${item.id}`}
                              src={item.image_url}
                              alt={item.name}
                              className="size-16 shrink-0 object-cover"
                              style={{ borderRadius: "12px" }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <motion.h4
                                  layoutId={`item-name-${item.id}`}
                                  className="font-medium"
                                >
                                  {item.name}
                                </motion.h4>
                                {item.primary_tag && (
                                  <motion.span
                                    layoutId={`item-tag-${item.id}`}
                                    className="flex items-center"
                                  >
                                    <Badge
                                      variant="default"
                                      className="px-2 py-0.5 text-[9px] tracking-[0.12em] uppercase"
                                    >
                                      {item.primary_tag}
                                    </Badge>
                                  </motion.span>
                                )}
                              </div>
                              <motion.span
                                layoutId={`item-price-${item.id}`}
                                className="text-sm text-neutral-700 tabular-nums"
                              >
                                {priceFormatter.format(item.price)}
                              </motion.span>
                            </div>
                            <motion.p
                              layoutId={`item-tagline-${item.id}`}
                              className="text-muted-foreground mt-1 line-clamp-2 max-w-md text-sm wrap-break-word"
                            >
                              {item.tagline}
                            </motion.p>
                            <AnimatePresence initial={false}>
                              {(item.description || item.image_url) && (
                                <motion.span
                                  animate={{
                                    opacity: isItemSelected ? 0 : 1,
                                  }}
                                  transition={{ duration: 0.225 }}
                                  className="mt-1 flex items-center gap-0.5 text-xs"
                                  style={{
                                    pointerEvents: isItemSelected
                                      ? "none"
                                      : "auto",
                                  }}
                                  aria-hidden={isItemSelected}
                                >
                                  View details
                                  <ArrowRight
                                    style={{ width: 12, height: 12 }}
                                  />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </section>
            ))
          )}

          {/* Item Dialog */}
          <Dialog.Root
            open={!!selectedItem}
            onOpenChange={() => setSelectedItem(null)}
          >
            <AnimatePresence>
              {selectedItem && (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild>
                    <motion.div
                      className="absolute inset-0 h-dvh bg-black/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    />
                  </Dialog.Overlay>
                  <div className="absolute inset-0 z-50 grid h-dvh place-items-center p-4">
                    <Dialog.Content forceMount asChild>
                      <motion.div
                        layoutId={`item-wrapper-${selectedItem.id}`}
                        key={selectedItem.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{
                          opacity: 0,
                        }}
                        style={{ borderRadius: 12 }}
                        className="h-auto w-full max-w-lg overflow-hidden bg-white outline-none"
                      >
                        {selectedItem.image_url && (
                          <motion.img
                            layoutId={`item-image-${selectedItem.id}`}
                            src={selectedItem.image_url}
                            alt={selectedItem.name}
                            className="h-48 w-full shrink-0 bg-red-50 object-cover"
                            style={{ borderRadius: "12px 12px 0 0" }}
                          />
                        )}
                        <div className="flex gap-4 px-6 pt-6">
                          <div className="flex-1">
                            <div className="flex justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <Dialog.Title asChild>
                                  <motion.h4
                                    layoutId={`item-name-${selectedItem.id}`}
                                    className="font-medium"
                                  >
                                    {selectedItem.name}
                                  </motion.h4>
                                </Dialog.Title>
                                {selectedItem.primary_tag && (
                                  <motion.span
                                    layoutId={`item-tag-${selectedItem.id}`}
                                    className="flex items-center"
                                  >
                                    <Badge
                                      variant="default"
                                      className="px-2 py-0.5 text-[9px] tracking-[0.12em] uppercase"
                                    >
                                      {selectedItem.primary_tag}
                                    </Badge>
                                  </motion.span>
                                )}
                              </div>
                              <motion.span
                                layoutId={`item-price-${selectedItem.id}`}
                                className="text-sm text-neutral-700 tabular-nums"
                              >
                                {priceFormatter.format(selectedItem.price)}
                              </motion.span>
                            </div>
                            <motion.p
                              layoutId={`item-tagline-${selectedItem.id}`}
                              className="text-muted-foreground mt-1 text-sm wrap-break-word"
                            >
                              {selectedItem.tagline}
                            </motion.p>
                            {selectedItem.tags &&
                              selectedItem.tags.length > 0 && (
                                <ul
                                  className="mt-4 flex flex-wrap gap-2"
                                  aria-label="Item tags"
                                >
                                  {selectedItem.tags.map((tag, index) => (
                                    <li
                                      key={`${selectedItem.id}-${tag}-${index}`}
                                    >
                                      <Badge
                                        variant="outline"
                                        className="px-3 py-1 text-[10px] uppercase"
                                      >
                                        {tag}
                                      </Badge>
                                    </li>
                                  ))}
                                </ul>
                              )}
                          </div>
                        </div>

                        <div className="via-border my-6 h-px bg-gradient-to-r from-transparent to-transparent" />

                        <Dialog.Description asChild>
                          <motion.p
                            layoutId={`item-description-${selectedItem.id}`}
                            className="px-6 wrap-break-word text-neutral-600"
                          >
                            {selectedItem.description}
                          </motion.p>
                        </Dialog.Description>
                        <div className="via-border my-6 h-px bg-gradient-to-r from-transparent to-transparent" />
                      </motion.div>
                    </Dialog.Content>
                  </div>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
        </div>
      </LayoutGroup>
      <footer className="mt-12">
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
