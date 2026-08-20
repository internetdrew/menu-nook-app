import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import BackToTopButton from "@/components/store-page/BackToTopButton";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { NotFound } from "./NotFoundPage";
import StoreUnavailable from "../components/StoreUnavailable";
import { toast } from "sonner";
import { LayoutGroup, useReducedMotion } from "motion/react";
import StorePreviewBanner from "@/components/StorePreviewBanner";
import StoreLogo from "@/components/StoreLogo";
import type { Database } from "../../shared/database.types";
import { isStoreSubscriptionActive } from "@/utils/subscription";
import { useAuth } from "@/contexts/auth";
import ItemImageDialog from "@/components/ItemImageDialog";
import StoreCategoriesWithItems from "@/components/store-page/StoreCategoriesWithItems";
import StoreNavigation from "@/components/store-page/StoreNavigation";

const publicStoreDomain =
  import.meta.env.VITE_PUBLIC_STORE_DOMAIN ||
  import.meta.env.VITE_PUBLIC_MENU_DOMAIN ||
  "https://menunook.com";

type StoreRecord = Database["public"]["Tables"]["stores"]["Row"];
export type StoreItem =
  Database["public"]["Tables"]["store_menu_category_items"]["Row"] & {
    order_index: number;
  };
export type StoreCategory =
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
  }, [hash, store]);

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
          <StoreNavigation
            ref={navRef}
            categories={categoriesWithItems}
            prefersReducedMotion={prefersReducedMotion}
            storeName={store.name}
          />
          {store.image_url && (
            <StoreLogo imageUrl={store.image_url} storeName={store.name} />
          )}

          <StoreCategoriesWithItems
            categories={categoriesWithItems}
            onSelectItem={setSelectedItem}
            prefersReducedMotion={prefersReducedMotion}
            selectedItemId={selectedItem?.id ?? null}
          />

          <ItemImageDialog
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
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

        <BackToTopButton
          hash={hash}
          navRef={navRef}
          pathname={pathname}
          search={search}
        />
      </div>
    </LayoutGroup>
  );
};
