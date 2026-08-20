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
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { NotFound } from "./NotFoundPage";
import StoreUnavailable from "../components/StoreUnavailable";
import { toast } from "sonner";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import StorePreviewBanner from "@/components/StorePreviewBanner";
import StoreLogo from "@/components/StoreLogo";
import type { Database } from "../../shared/database.types";
import { isStoreSubscriptionActive } from "@/utils/subscription";
import { useAuth } from "@/contexts/auth";
import ItemImageDialog from "@/components/ItemImageDialog";

const publicStoreDomain =
  import.meta.env.VITE_PUBLIC_STORE_DOMAIN ||
  import.meta.env.VITE_PUBLIC_MENU_DOMAIN ||
  "https://menunook.com";
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dialogEaseOut = [0.215, 0.61, 0.355, 1] as const;
const menuToggleTransition = {
  duration: 0.18,
  ease: dialogEaseOut,
} as const;

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

const isElementClamped = (element: HTMLElement) =>
  element.scrollHeight > element.clientHeight;

const StoreItemDescription = ({ description }: { description: string }) => {
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const descriptionElement = descriptionRef.current;
    if (!descriptionElement) return;
    let isMounted = true;

    const updateClampState = () => {
      if (!isMounted) return;
      setIsClamped(isElementClamped(descriptionElement));
    };

    updateClampState();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateClampState);
    resizeObserver?.observe(descriptionElement);

    document.fonts?.ready.then(updateClampState);

    return () => {
      isMounted = false;
      resizeObserver?.disconnect();
    };
  }, [description]);

  return (
    <motion.p
      ref={descriptionRef}
      className={`text-muted-foreground line-clamp-2 max-w-sm text-xs wrap-break-word ${
        isClamped ? "cursor-pointer" : ""
      }`}
      data-clamped={isClamped ? "true" : "false"}
      title={isClamped ? description : undefined}
    >
      {description}
    </motion.p>
  );
};

const CategoryMenuIcon = ({
  isOpen,
  reduceMotion,
}: {
  isOpen: boolean;
  reduceMotion: boolean | null;
}) => {
  const transition = reduceMotion ? { duration: 0.01 } : menuToggleTransition;

  return (
    <span
      aria-hidden="true"
      className="relative block size-5"
      data-state={isOpen ? "open" : "closed"}
    >
      <motion.span
        className="absolute top-1/2 left-1/2 h-[1.67px] w-[13.33px] rounded-full bg-current"
        initial={false}
        animate={{
          x: "-50%",
          y: isOpen ? "-50%" : "calc(-50% - 5px)",
          rotate: isOpen ? 45 : 0,
        }}
        transition={transition}
      />
      <motion.span
        className="absolute top-1/2 left-1/2 h-[1.67px] w-[13.33px] rounded-full bg-current"
        initial={false}
        animate={{
          x: "-50%",
          y: "-50%",
          opacity: isOpen ? 0 : 1,
          scaleX: isOpen ? 0.65 : 1,
        }}
        transition={transition}
      />
      <motion.span
        className="absolute top-1/2 left-1/2 h-[1.67px] w-[13.33px] rounded-full bg-current"
        initial={false}
        animate={{
          x: "-50%",
          y: isOpen ? "-50%" : "calc(-50% + 5px)",
          rotate: isOpen ? -45 : 0,
        }}
        transition={transition}
      />
    </span>
  );
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
            <h1 className="menu-header min-w-0 flex-1 truncate text-left text-lg font-semibold">
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
                  <CategoryMenuIcon
                    isOpen={categoryMenuOpen}
                    reduceMotion={prefersReducedMotion}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
            categoriesWithItems?.map((category) => (
              <section key={category.id} className="mt-14">
                <h3
                  id={createSlug(category.name)}
                  className="menu-header scroll-mt-20 font-medium text-neutral-950"
                >
                  {category.name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {category.description}
                </p>

                <ul className="mt-8 space-y-6">
                  {category.items?.map((item) => {
                    return (
                      <li
                        key={item.id}
                        className="border-b border-neutral-200/50 pb-6 last:border-b-0"
                      >
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
                                  layoutId={`store-item-image-${item.id}`}
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
                            <div className="flex flex-1 flex-col gap-0.5 text-sm">
                              <motion.h4 className="font-medium wrap-break-word">
                                {item.name}
                              </motion.h4>

                              {item?.description && (
                                <StoreItemDescription
                                  description={item.description}
                                />
                              )}
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

          <ItemImageDialog
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            dialogEaseOut={dialogEaseOut}
          />
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
