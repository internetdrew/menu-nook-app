import { Toaster } from "@/components/ui/sonner";
import LoadingSpinner from "./components/LoadingSpinner";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useStoreContext } from "./contexts/StoreContext";
import { Skeleton } from "./components/ui/skeleton";
import StoreCategoriesSkeleton from "./components/skeletons/StoreCategoriesSkeleton";
import { Link, useSearchParams } from "react-router";
import { ScrollText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "./utils/trpc";
import { isStoreSubscriptionActive } from "./utils/subscription";
import ShareQRButtonDialog from "./components/home/ShareQRButtonDialog";
import { Button } from "./components/ui/button";
import { MENU_SWITCHER_ENTER_TRANSITION } from "./constants";

const loadOnboardingChecklist = () =>
  import("./components/OnboardingChecklist").then((module) => ({
    default: module.OnboardingChecklist,
  }));
const loadHomePage = () =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage }));

const OnboardingChecklist = lazy(loadOnboardingChecklist);
const HomePage = lazy(loadHomePage);

const appViewTransition = {
  duration: 0.22,
  ease: [0.215, 0.61, 0.355, 1],
} as const;

const HomeShellSkeleton = () => (
  <div className="pt-24 pb-10">
    <div className="mt-12">
      <StoreCategoriesSkeleton />
    </div>
  </div>
);

function App() {
  const { store, storeId, loading: storeSetupLoading } = useStoreContext();
  const [params, setSearchParams] = useSearchParams();
  const wasOnboardingVisible = useRef(false);
  const [hasAcceptedOnboardingSuccess, setHasAcceptedOnboardingSuccess] =
    useState(false);
  const [showLaunchSuccess, setShowLaunchSuccess] = useState(false);

  const { data: subscription, isLoading: loadingSubscription } = useQuery(
    trpc.subscription.getForStore.queryOptions(
      { storeId: storeId ?? "" },
      {
        enabled: !!storeId,
        refetchInterval: showLaunchSuccess ? 2000 : false,
      },
    ),
  );
  const subscriptionIsActive = isStoreSubscriptionActive(subscription);
  const loadingHeaderAction =
    storeSetupLoading || (!!storeId && loadingSubscription);

  const isAppLoading = storeSetupLoading && !wasOnboardingVisible.current;
  const isSetupComplete = !!store;
  const shouldShowOnboardingSuccess =
    isSetupComplete &&
    wasOnboardingVisible.current &&
    !hasAcceptedOnboardingSuccess;
  const appView = isAppLoading
    ? "loading"
    : !isSetupComplete || shouldShowOnboardingSuccess
      ? "onboarding"
      : "home";

  useEffect(() => {
    if (store) {
      void loadHomePage();
    }
  }, [store]);

  useEffect(() => {
    if (appView === "onboarding") {
      wasOnboardingVisible.current = true;
    }

    if (appView === "home") {
      wasOnboardingVisible.current = false;
    }
  }, [appView]);

  useEffect(() => {
    if (!isSetupComplete) {
      setHasAcceptedOnboardingSuccess(false);
    }
  }, [isSetupComplete]);

  useEffect(() => {
    const successfulSubscription = params.get("success") === "true";

    if (successfulSubscription) {
      setShowLaunchSuccess(true);

      const newParams = new URLSearchParams(params);
      newParams.delete("success");
      setSearchParams(newParams, { replace: true });
    }
  }, [params, setSearchParams]);

  return (
    <div className="min-h-dvh">
      <div className="fixed inset-0 -z-10 bg-stone-100 bg-cover bg-center" />
      <nav className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto mt-4 flex max-w-xl items-center justify-between px-4">
          <div>
            <h1 className="title truncate font-[560] sm:text-lg">
              {store?.name ?? "MenuNook"}
            </h1>
            {store && (
              <p className="text-muted-foreground mt-1 text-xs">
                Powered by{" "}
                <a
                  href="https://menunook.com"
                  className="text-neutral-700 underline decoration-neutral-400 underline-offset-4 transition duration-200 hover:decoration-neutral-600"
                >
                  MenuNook
                </a>
              </p>
            )}
          </div>
          <div className="flex w-24 items-center justify-end">
            {loadingHeaderAction ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                {store ? (
                  <motion.div
                    key={subscriptionIsActive ? "share-button" : "preview-link"}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={MENU_SWITCHER_ENTER_TRANSITION}
                  >
                    {subscriptionIsActive ? (
                      <ShareQRButtonDialog
                        storeId={store.id}
                        storeSlug={store.menu_slug}
                        storeName={store.name}
                        mode={showLaunchSuccess ? "launch-success" : "share"}
                        openOnMount={showLaunchSuccess}
                        onLaunchSuccessComplete={() =>
                          setShowLaunchSuccess(false)
                        }
                      />
                    ) : (
                      <Button
                        asChild
                        variant="ghost"
                        className="hover:bg-stone-200 focus-visible:bg-stone-200"
                      >
                        <Link to="/preview/store">
                          <ScrollText />
                          Preview
                        </Link>
                      </Button>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto flex min-h-dvh max-w-xl items-start px-4 pb-8">
        <AnimatePresence mode="wait" initial={false}>
          {appView === "loading" ? (
            <motion.div
              key="loading"
              role="status"
              aria-label="Loading store setup"
              className="flex w-full justify-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={appViewTransition}
            >
              <LoadingSpinner />
            </motion.div>
          ) : appView === "onboarding" ? (
            <motion.div
              key="onboarding"
              className="mt-40 w-full"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={appViewTransition}
            >
              <Suspense fallback={<LoadingSpinner />}>
                <OnboardingChecklist
                  store={store}
                  onContinue={() => setHasAcceptedOnboardingSuccess(true)}
                />
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="home"
              className="w-full"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={appViewTransition}
            >
              <Suspense fallback={<HomeShellSkeleton />}>
                <HomePage />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
