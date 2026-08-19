import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { createSlug } from "@/utils/createSlug";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { NotFound } from "./NotFoundPage";
import StoreUnavailable from "../components/StoreUnavailable";
import { toast } from "sonner";
import { Dialog } from "radix-ui";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import StorePreviewBanner from "@/components/StorePreviewBanner";
import StoreLogo from "@/components/StoreLogo";
import type { Database } from "../../shared/database.types";
import { isStoreSubscriptionActive } from "@/utils/subscription";
import { useAuth } from "@/contexts/auth";

const publicStoreDomain =
  import.meta.env.VITE_PUBLIC_STORE_DOMAIN ||
  import.meta.env.VITE_PUBLIC_MENU_DOMAIN ||
  "https://menunook.com";
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const dialogEaseOut = [0.215, 0.61, 0.355, 1] as const;
const getItemImageLayoutId = (itemId: number) => `store-item-image-${itemId}`;

type StoreRecord = Database["public"]["Tables"]["stores"]["Row"];
export type StoreItem =
  Database["public"]["Tables"]["store_menu_category_items"]["Row"] & {
    order_index: number;
  };
type StoreCategory =
  Database["public"]["Tables"]["store_menu_categories"]["Row"] & {
    items: StoreItem[];
  };
type StoreData = StoreRecord & {
  store_menu_categories: StoreCategory[];
};

export const Store = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { hash, pathname, search } = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const isPreview = pathname.startsWith("/preview/");
  const successfulSubscription =
    new URLSearchParams(search).get("success") === "true";

  const userStoreQuery = useQuery(
    trpc.store.getForUser.queryOptions(undefined, {
      enabled: isPreview && !authLoading && !!user,
    }),
  );

  const publicStoreQuery = useQuery(
    trpc.store.getPublic.queryOptions(
      { storeSlug: storeSlug ?? "" },
      { enabled: !isPreview && !!storeSlug },
    ),
  );

  const previewStoreId = isPreview ? userStoreQuery.data?.id : undefined;
  const {
    data: previewStoreData,
    isLoading: previewStoreIsLoading,
    error: previewStoreError,
  } = useQuery(
    trpc.store.getPreview.queryOptions(
      { storeId: previewStoreId ?? "" },
      {
        enabled: !!previewStoreId,
      },
    ),
  );
  const store = (isPreview ? previewStoreData : publicStoreQuery.data) as
    | StoreData
    | null
    | undefined;
  const storeIsLoading = isPreview
    ? authLoading || userStoreQuery.isLoading || previewStoreIsLoading
    : publicStoreQuery.isLoading;
  const error = isPreview
    ? userStoreQuery.error || previewStoreError
    : publicStoreQuery.error;

  const { data: subscription, isLoading: subscriptionIsLoading } = useQuery(
    trpc.subscription.getForStore.queryOptions(
      {
        storeId: store?.id ?? "",
      },
      {
        enabled: !!store?.id,
      },
    ),
  );

  const subscriptionIsActive = isStoreSubscriptionActive(subscription);

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
  }, [store, subscriptionIsActive]);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
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
    if (!isPreview || !successfulSubscription || !store) return;

    toast.success(`${store.name} is now live.`);
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
    store,
    navigate,
    pathname,
    search,
    successfulSubscription,
  ]);

  const categoriesWithItems = store?.store_menu_categories.filter(
    (category) => category.items && category.items.length > 0,
  );

  if (storeIsLoading || previewStoreIsLoading || subscriptionIsLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <Skeleton className="mx-auto mb-6 h-8 w-1/4" />
        <Skeleton className="mx-auto mt-8 h-8 w-1/4" />
        <Skeleton className="mt-16 mb-2 h-8 w-1/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (!store || error) {
    return (
      <NotFound
        title="Store Not Found"
        message="The store you're looking for does not exist."
        href="/"
        hrefText="Go back to Home"
      />
    );
  }

  if (!isPreview && store && !subscriptionIsActive) {
    return <StoreUnavailable storeName={store.name} />;
  }

  return (
    <LayoutGroup id="store-item-images">
      <div className="relative flex min-h-dvh flex-col">
        <StorePreviewBanner
          subscriptionIsActive={subscriptionIsActive}
          publicStoreDomain={publicStoreDomain}
          store={store}
        />

        <div className="mx-auto mt-6 w-full max-w-xl flex-1 px-4">
          <nav
            ref={navRef}
            className="mb-6 flex items-center justify-between gap-4 text-neutral-950"
          >
            <h1 className="min-w-0 flex-1 truncate text-left text-lg font-semibold">
              {store.name}
            </h1>
            <DropdownMenu
              open={categoryMenuOpen}
              onOpenChange={setCategoryMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-neutral-700"
                  aria-label={
                    categoryMenuOpen
                      ? "Close category menu"
                      : "Open category menu"
                  }
                >
                  {categoryMenuOpen ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                // className="min-w-48 rounded-xl border-0 bg-white p-1.5"
                // style={{
                //   boxShadow: "rgba(0, 0, 0, 0.1) 0px 0px 0px 1px",
                //   transition: "box-shadow 0.3s",
                // }}
              >
                <DropdownMenuGroup>
                  {categoriesWithItems?.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      className="rounded-md"
                      asChild
                    >
                      <Link
                        replace
                        to={{ hash: `#${createSlug(category.name)}` }}
                        className="text-sm font-[460]"
                      >
                        {category.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          {store.image_url && (
            <StoreLogo imageUrl={store.image_url} storeName={store.name} />
          )}

          {/* Categories and Items */}
          {categoriesWithItems?.length === 0 ? (
            <p className="mt-16 text-center">No categories available.</p>
          ) : (
            categoriesWithItems?.map((category, index) => (
              <section key={category.id} className="mt-16">
                {index > 0 && (
                  <div
                    aria-hidden="true"
                    className="mx-auto mb-14 h-px w-36 bg-neutral-100"
                  />
                )}
                <h3
                  id={createSlug(category.name)}
                  className="scroll-mt-20 font-medium"
                >
                  {category.name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {category.description}
                </p>

                <ul className="mt-8 space-y-6">
                  {category.items?.map((item) => {
                    return (
                      <li key={item.id}>
                        <div className="block w-full rounded-md text-left">
                          <div className="flex items-center justify-between gap-2">
                            {item.image_url && (
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="group/image size-16 shrink-0 overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-4 focus-visible:outline-none"
                                aria-label={`View image for ${item.name}`}
                              >
                                <motion.img
                                  layoutId={getItemImageLayoutId(item.id)}
                                  src={item.image_url}
                                  alt={item.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="size-full object-cover"
                                  style={{
                                    borderRadius: 12,
                                    willChange: "transform, opacity",
                                  }}
                                  transition={{
                                    layout: {
                                      duration: prefersReducedMotion
                                        ? 0.01
                                        : 0.28,
                                      ease: dialogEaseOut,
                                    },
                                  }}
                                />
                              </button>
                            )}
                            <div className="flex flex-1 flex-col gap-1 text-sm">
                              <motion.h4 className="font-medium wrap-break-word">
                                {item.name}
                              </motion.h4>

                              <motion.p className="text-muted-foreground line-clamp-3 max-w-sm text-xs wrap-break-word">
                                {item?.description}
                              </motion.p>
                            </div>
                            <motion.span className="shrink-0 text-xs font-medium text-neutral-700 tabular-nums">
                              {priceFormatter.format(item.price)}
                            </motion.span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}

          {/* Item Image Dialog */}
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
                  <motion.div
                    layoutRoot
                    className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4"
                  >
                    <Dialog.Content forceMount asChild>
                      <motion.div className="relative my-auto aspect-[4/3] w-full max-w-lg overflow-visible bg-transparent shadow-none outline-none">
                        <Dialog.Title className="sr-only">
                          {selectedItem.name} image
                        </Dialog.Title>
                        <Dialog.Description className="sr-only">
                          Full-size item image.
                        </Dialog.Description>
                        {selectedItem.image_url && (
                          <motion.img
                            layoutId={getItemImageLayoutId(selectedItem.id)}
                            src={selectedItem.image_url}
                            alt={selectedItem.name}
                            decoding="async"
                            className="size-full object-cover shadow-xl"
                            style={{
                              borderRadius: 12,
                              willChange: "transform, opacity",
                            }}
                            transition={{
                              layout: {
                                duration: prefersReducedMotion ? 0.01 : 0.28,
                                ease: dialogEaseOut,
                              },
                            }}
                          />
                        )}
                        <Dialog.Close asChild>
                          <motion.button
                            type="button"
                            className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white/70 text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none"
                            aria-label="Close image"
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={{
                              hidden: {
                                opacity: 0,
                                transition: {
                                  duration: prefersReducedMotion ? 0.01 : 0,
                                },
                              },
                              visible: {
                                opacity: 1,
                                transition: {
                                  duration: prefersReducedMotion ? 0.01 : 0.12,
                                  delay: prefersReducedMotion ? 0 : 0.28,
                                },
                              },
                            }}
                          >
                            <X className="size-4" />
                          </motion.button>
                        </Dialog.Close>
                      </motion.div>
                    </Dialog.Content>
                  </motion.div>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
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
    </LayoutGroup>
  );
};
