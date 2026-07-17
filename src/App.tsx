import { Toaster } from "@/components/ui/sonner";
import LoadingSpinner from "./components/LoadingSpinner";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useMenuContext } from "./contexts/ActiveMenuContext";
import { Skeleton } from "./components/ui/skeleton";
import MenuCategoriesSkeleton from "./components/skeletons/MenuCategoriesSkeleton";

const loadOnboardingChecklist = () =>
  import("./components/OnboardingChecklist").then((module) => ({
    default: module.OnboardingChecklist,
  }));
const loadHomePage = () =>
  import("./routes/HomePage").then((module) => ({ default: module.HomePage }));

const OnboardingChecklist = lazy(loadOnboardingChecklist);
const HomePage = lazy(loadHomePage);

const appViewTransition = {
  duration: 0.22,
  ease: [0.215, 0.61, 0.355, 1],
} as const;

const HomeShellSkeleton = () => (
  <div className="pb-10">
    <div className="mx-auto max-w-xl pt-4 pb-3 backdrop-blur-sm after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-[90%] after:-translate-x-1/2 after:bg-neutral-200/60">
      <div className="mt-12 flex items-center justify-between">
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
    <div className="mt-12">
      <MenuCategoriesSkeleton />
    </div>
  </div>
);

function App() {
  const { business, menus, loading: menuSetupLoading } = useMenuContext();
  const wasOnboardingVisible = useRef(false);
  const [hasAcceptedOnboardingSuccess, setHasAcceptedOnboardingSuccess] =
    useState(false);

  const isAppLoading = menuSetupLoading && !wasOnboardingVisible.current;
  const isSetupComplete = !!business && !!menus?.length;
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
    if (business) {
      void loadHomePage();
    }
  }, [business]);

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

  return (
    <div className="min-h-dvh">
      <div className="fixed inset-0 -z-10 bg-stone-100 bg-cover bg-center" />
      <nav className="fixed inset-x-0 top-0 z-40">
        <p className="title mt-4 text-center font-[560] sm:text-lg">MenuNook</p>
      </nav>
      <main className="mx-auto flex min-h-dvh max-w-xl items-start px-4 pb-8">
        <AnimatePresence mode="wait" initial={false}>
          {appView === "loading" ? (
            <motion.div
              key="loading"
              role="status"
              aria-label="Loading menu setup"
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
                  business={business}
                  menus={menus}
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
