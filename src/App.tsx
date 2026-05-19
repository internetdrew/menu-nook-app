import { DashboardPage } from "@/components/Dashboard";
import ShareQRButtonDialog from "@/components/home/ShareQRButtonDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { AnimatePresence, motion } from "motion/react";
import loginBackground from "@/assets/login-bg.png";
import { MenuSwitcher } from "./components/MenuSwitcher";
import { MENU_SWITCHER_ENTER_TRANSITION } from "./constants";

function App() {
  const { activeMenu, loading } = useMenuContext();

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
        <div className="mx-auto max-w-xl border-b border-neutral-200 bg-[#fff9ef]/95 px-4 pt-4 pb-3 backdrop-blur-sm">
          <p className="title text-center font-bold">MenuNook</p>
          <div className="mt-4 flex items-center justify-between">
            <MenuSwitcher />
            <div className="flex w-24 items-center justify-end">
              {loading ? (
                <Skeleton className="h-9 w-full rounded-md" />
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  {activeMenu ? (
                    <motion.div
                      key="share-button"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={MENU_SWITCHER_ENTER_TRANSITION}
                    >
                      <ShareQRButtonDialog
                        activeMenuId={activeMenu.id}
                        activeMenuName={activeMenu.name}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-xl px-4 pt-34 pb-10">
        <DashboardPage />
      </main>
      <Toaster />
    </div>
  );
}

export default App;
