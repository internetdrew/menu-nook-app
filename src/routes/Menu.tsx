import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { createSlug } from "@/utils/createSlug";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { NotFound } from "./NotFound";
import MenuUnavailable from "../components/MenuUnavailable";
import { toast } from "sonner";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import MenuPreviewBanner from "@/components/MenuPreviewBanner";
import BusinessLogo from "@/components/BusinessLogo";
import type { Database } from "../../shared/database.types";
import { isMenuSubscriptionActive } from "@/utils/subscription";

const liveSiteUrl = import.meta.env.VITE_APP_DOMAIN;
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const dialogEaseOut = [0.215, 0.61, 0.355, 1] as const;

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type MenuRecord = Database["public"]["Tables"]["menus"]["Row"];
export type MenuItem =
  Database["public"]["Tables"]["menu_category_items"]["Row"] & {
    order_index: number;
  };
type MenuCategory = Database["public"]["Tables"]["menu_categories"]["Row"] & {
  items: MenuItem[];
};
type MenuData = MenuRecord & {
  business: Business;
  menu_categories: MenuCategory[];
};

export const Menu = () => {
  const { menuId } = useParams<{ menuId: string }>();
  const { hash, pathname, search } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const isPreview = pathname.startsWith("/preview/");
  const successfulSubscription =
    new URLSearchParams(search).get("success") === "true";

  const {
    data: menuQueryData,
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
  const menu = menuQueryData as MenuData | null | undefined;

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

  const subscriptionIsActive = isMenuSubscriptionActive(subscription);

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
    <div className="relative flex min-h-dvh flex-col">
      <MenuPreviewBanner
        subscriptionIsActive={subscriptionIsActive}
        liveSiteUrl={liveSiteUrl}
        menu={menu}
      />

      <div className="mx-auto mt-6 w-full max-w-xl flex-1 px-4">
        {menu.business.image_url && (
          <BusinessLogo
            imageUrl={menu.business.image_url}
            businessName={menu.business.name}
          />
        )}
        <h1 className="text-center text-lg font-semibold">
          {menu.business.name}
        </h1>
        {/* <h2 className="text-muted-foreground mt-1 text-center text-lg">
            {menu.name}
          </h2> */}
        <nav
          ref={navRef}
          className="my-6 flex flex-wrap items-center justify-center gap-4 text-neutral-700"
        >
          <ul className="flex flex-wrap items-center justify-center gap-6 text-xs">
            {categoriesWithItems?.map((category) => {
              return (
                <li key={category.id}>
                  <Link
                    replace
                    to={{ hash: `#${createSlug(category.name)}` }}
                    className="decoration-neutral-300 underline-offset-4 transition duration-300 hover:decoration-neutral-600"
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
                className="scroll-mt-20 text-sm font-medium"
              >
                {category.name}
              </h3>
              <p className="mb-4 border-b pb-3 text-xs text-neutral-700">
                {category.description}
              </p>

              <motion.ul layout className="space-y-6">
                {category.items?.map((item) => {
                  const shouldShowDetails = item.description || item.image_url;

                  return (
                    <motion.li layout key={item.id}>
                      <motion.div
                        onClick={() => {
                          if (shouldShowDetails) setSelectedItem(item);
                        }}
                        onKeyDown={(event) => {
                          if (
                            !shouldShowDetails ||
                            (event.key !== "Enter" && event.key !== " ")
                          ) {
                            return;
                          }

                          event.preventDefault();
                          setSelectedItem(item);
                        }}
                        role={shouldShowDetails ? "button" : undefined}
                        tabIndex={shouldShowDetails ? 0 : undefined}
                        aria-label={
                          shouldShowDetails
                            ? `View details for ${item.name}`
                            : undefined
                        }
                        className={`block w-full rounded-md text-left ${
                          shouldShowDetails
                            ? "group cursor-pointer transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-4 focus-visible:outline-none"
                            : "cursor-default"
                        }`}
                      >
                        <div className="flex gap-4">
                          {item.image_url && (
                            <motion.img
                              src={item.image_url}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              className="size-16 shrink-0 object-cover"
                              style={{ borderRadius: "12px" }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between gap-4 text-sm">
                              <motion.h4 className="font-medium wrap-break-word">
                                {item.name}
                              </motion.h4>
                              <div className="flex shrink-0 items-center gap-1">
                                <motion.span className="text-xs text-neutral-700 tabular-nums">
                                  {priceFormatter.format(item.price)}
                                </motion.span>
                                {shouldShowDetails && (
                                  <ChevronRight
                                    aria-hidden="true"
                                    className="size-4 text-neutral-400 transition-colors group-hover:text-neutral-700"
                                  />
                                )}
                              </div>
                            </div>
                            {(item.tagline || shouldShowDetails) && (
                              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                {item.tagline && (
                                  <motion.p className="text-muted-foreground line-clamp-2 max-w-md text-xs wrap-break-word">
                                    {item.tagline}
                                  </motion.p>
                                )}
                                {shouldShowDetails && (
                                  <span className="text-xs font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors group-hover:text-neutral-950 group-hover:decoration-neutral-500">
                                    View details
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </section>
          ))
        )}

        {/* Item Dialog */}
        {isMobile ? (
          <Drawer
            open={!!selectedItem}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedItem(null);
              }
            }}
          >
            {selectedItem && (
              <DrawerContent className="overflow-hidden">
                <div className="no-scrollbar max-h-[80vh] overflow-y-auto">
                  {selectedItem.image_url && (
                    <div className="bg-muted relative aspect-[4/3] max-h-[55dvh] w-full shrink-0 overflow-hidden">
                      <img
                        src={selectedItem.image_url}
                        alt={selectedItem.name}
                        decoding="async"
                        className="size-full object-cover"
                      />
                      <DrawerClose asChild>
                        <button
                          type="button"
                          className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white/75 text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none"
                          aria-label="Close item details"
                        >
                          <X className="size-4" />
                        </button>
                      </DrawerClose>
                    </div>
                  )}
                  <DrawerHeader className="px-6 pt-6 pb-2 text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <DrawerTitle>{selectedItem.name}</DrawerTitle>
                        <p className="text-muted-foreground mt-1 text-sm wrap-break-word">
                          {selectedItem.tagline}
                        </p>
                      </div>
                      <span className="text-sm text-neutral-700 tabular-nums">
                        {priceFormatter.format(selectedItem.price)}
                      </span>
                    </div>
                  </DrawerHeader>
                  {selectedItem.description ? (
                    <>
                      <div className="via-border my-4 h-px bg-gradient-to-r from-transparent to-transparent" />
                      <DrawerDescription className="px-6 pb-6 text-sm wrap-break-word text-neutral-950">
                        {selectedItem.description}
                      </DrawerDescription>
                    </>
                  ) : (
                    <DrawerDescription className="sr-only">
                      Menu item details.
                    </DrawerDescription>
                  )}
                </div>
              </DrawerContent>
            )}
          </Drawer>
        ) : (
          <Dialog.Root
            open={!!selectedItem}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedItem(null);
              }
            }}
          >
            <AnimatePresence>
              {selectedItem && (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild>
                    <motion.div
                      className="fixed inset-0 z-50 bg-black/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: prefersReducedMotion ? 0.01 : 0.16,
                      }}
                    />
                  </Dialog.Overlay>
                  <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
                    <Dialog.Content forceMount asChild>
                      <motion.div
                        key={selectedItem.id}
                        initial={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: 8, scale: 0.98 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          ...(prefersReducedMotion
                            ? {}
                            : { y: 6, scale: 0.99 }),
                        }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0.01 }
                            : { duration: 0.22, ease: dialogEaseOut }
                        }
                        style={{
                          borderRadius: 12,
                          willChange: "transform, opacity",
                        }}
                        className="my-auto h-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto bg-white pb-6 shadow-xl outline-none"
                      >
                        {selectedItem.image_url && (
                          <div
                            className="bg-muted relative aspect-[4/3] max-h-[55dvh] w-full shrink-0 overflow-hidden"
                            style={{ borderRadius: "12px 12px 0 0" }}
                          >
                            <img
                              src={selectedItem.image_url}
                              alt={selectedItem.name}
                              decoding="async"
                              className="size-full object-cover"
                            />
                            <Dialog.Close asChild>
                              <button
                                type="button"
                                className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white/70 text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none"
                                aria-label="Close item details"
                              >
                                <X className="size-4" />
                              </button>
                            </Dialog.Close>
                          </div>
                        )}
                        <div className="relative flex gap-4 px-6 pt-6">
                          {!selectedItem.image_url && (
                            <Dialog.Close asChild>
                              <button
                                type="button"
                                className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none"
                                aria-label="Close item details"
                              >
                                <X className="size-4" />
                              </button>
                            </Dialog.Close>
                          )}
                          <div className="min-w-0 flex-1 pr-10">
                            <div className="flex justify-between gap-4">
                              <Dialog.Title asChild>
                                <h4 className="font-medium wrap-break-word">
                                  {selectedItem.name}
                                </h4>
                              </Dialog.Title>
                              <span className="shrink-0 text-sm text-neutral-700 tabular-nums">
                                {priceFormatter.format(selectedItem.price)}
                              </span>
                            </div>
                            {selectedItem.tagline && (
                              <p className="text-muted-foreground mt-1 text-sm wrap-break-word">
                                {selectedItem.tagline}
                              </p>
                            )}
                          </div>
                        </div>

                        {selectedItem.description ? (
                          <div className="pb-6">
                            <div className="via-border my-6 h-px bg-gradient-to-r from-transparent to-transparent" />
                            <Dialog.Description asChild>
                              <p className="px-6 text-sm wrap-break-word">
                                {selectedItem.description}
                              </p>
                            </Dialog.Description>
                          </div>
                        ) : (
                          <Dialog.Description className="sr-only">
                            Menu item details.
                          </Dialog.Description>
                        )}
                      </motion.div>
                    </Dialog.Content>
                  </div>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
        )}
      </div>
      <footer className="mt-auto pt-12">
        <div className="text-muted-foreground mx-auto my-8 max-w-screen-sm px-4 text-center text-xs">
          <span>
            Powered by{" "}
            <a
              href="https://menunook.com"
              className="text-neutral-700 underline decoration-neutral-400 underline-offset-4 transition duration-200 hover:decoration-neutral-600"
            >
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
