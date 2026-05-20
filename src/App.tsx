import { Toaster } from "@/components/ui/sonner";
import loginBackground from "@/assets/login-bg.png";
import { useAuth } from "./contexts/auth";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "./utils/trpc";
import { OnboardingChecklist } from "./components/OnboardingChecklist";
import { HomePage } from "./routes/HomePage";
import LoadingSpinner from "./components/LoadingSpinner";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

const appViewTransition = {
  duration: 0.22,
  ease: [0.215, 0.61, 0.355, 1],
} as const;

function App() {
  const { user, isLoading: authLoading } = useAuth();
  const wasOnboardingVisible = useRef(false);

  const { data: business, isLoading: businessLoading } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );

  const { data: menus, isLoading: menusLoading } = useQuery(
    trpc.menu.getAllForBusiness.queryOptions(
      {
        businessId: business?.id || "",
      },
      { enabled: !!business && !!user && !authLoading },
    ),
  );

  const isInitialMenusLoading =
    !!business &&
    menusLoading &&
    menus === undefined &&
    !wasOnboardingVisible.current;
  const isAppLoading = authLoading || businessLoading || isInitialMenusLoading;
  const appView = isAppLoading
    ? "loading"
    : !business || !menus?.length
      ? "onboarding"
      : "home";

  useEffect(() => {
    if (appView === "onboarding") {
      wasOnboardingVisible.current = true;
    }

    if (appView === "home") {
      wasOnboardingVisible.current = false;
    }
  }, [appView]);

  return (
    <div className="min-h-dvh">
      <div
        className="fixed inset-0 -z-10 bg-[#fff9ef] bg-cover bg-center"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 48% 40%, rgba(255, 250, 241, 0.96) 0, rgba(255, 250, 241, 0.62) 22rem, rgba(255, 250, 241, 0.12) 43rem)",
            "linear-gradient(180deg, rgba(255, 249, 238, 0.16), rgba(255, 243, 222, 0.32))",
            `url(${loginBackground})`,
          ].join(", "),
        }}
      />
      <nav className="fixed inset-x-0 top-0 z-40">
        <p className="title mt-4 text-center font-bold">MenuNook</p>
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
              <OnboardingChecklist business={business} menus={menus} />
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
              <HomePage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
