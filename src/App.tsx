import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { OnboardingChecklist } from "./components/OnboardingChecklist";
import { HomePage } from "./pages/HomePage";
import HeaderTitle from "./components/home/HeaderTitle";
import StoreViewerOptions from "./components/home/StoreViewerOptions.tsx";
import { useStoreContext } from "./contexts/StoreContext";
import { MenuLoader } from "./components/MenuLoader";

const appViewTransition = {
  duration: 0.22,
  ease: [0.215, 0.61, 0.355, 1],
} as const;

function App() {
  const { store, loading: storeLoading } = useStoreContext();

  if (storeLoading) {
    return (
      <>
        <MenuLoader />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-dvh">
      <nav className="bg-background fixed inset-x-0 top-0 z-40">
        <header className="mx-auto mt-4 flex max-w-xl items-center justify-between px-4">
          <HeaderTitle />

          {store && (
            <StoreViewerOptions
              storeId={store.id}
              storeMenuSlug={store.menu_slug}
              storeName={store.name}
            />
          )}
        </header>
      </nav>

      <main className="mx-auto flex min-h-dvh max-w-xl items-start px-4 pb-8">
        <AnimatePresence mode="wait" initial={false}>
          {store ? (
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
          ) : (
            <motion.div
              key="onboarding"
              className="mt-40 w-full"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={appViewTransition}
            >
              <OnboardingChecklist />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
