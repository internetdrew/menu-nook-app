import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/components/Dashboard";
import ShareQRButtonDialog from "@/components/home/ShareQRButtonDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { AnimatePresence, motion } from "motion/react";

const MENU_SWITCHER_EXIT_TRANSITION = {
  duration: 0.18,
  ease: [0.26, 0.08, 0.25, 1],
} as const;
const MENU_SWITCHER_ENTER_TRANSITION = {
  duration: 0.22,
  ease: [0.25, 1, 0.5, 1],
} as const;

function AppMenuSwitcher() {
  const navigate = useNavigate();
  const { menus, activeMenu, setActiveMenu, loading } = useMenuContext();

  return (
    <div className="w-40 max-w-64">
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="menu-switcher-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={MENU_SWITCHER_EXIT_TRANSITION}
          >
            <Skeleton className="h-9 w-full rounded-md" />
          </motion.div>
        ) : (
          <motion.div
            key="menu-switcher-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={MENU_SWITCHER_ENTER_TRANSITION}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-2">
                  <span className="truncate">
                    {activeMenu?.name ?? "No menu selected"}
                  </span>
                  <ChevronDown className="text-muted-foreground ml-auto size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Menus
                </DropdownMenuLabel>
                {menus.map((menu) => (
                  <DropdownMenuItem
                    key={menu.id}
                    onClick={() => {
                      setActiveMenu(menu);
                      navigate("/");
                    }}
                  >
                    {menu.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  const { activeMenu, loading } = useMenuContext();

  return (
    <>
      <nav className="sticky top-0 z-40 m-4 mx-auto max-w-xl border-b border-neutral-100 pb-3">
        <p className="text-center font-black">MenuNook</p>
        <div className="mt-4 flex items-center justify-between">
          <AppMenuSwitcher />
          <div className="flex w-24 items-center justify-end">
            <AnimatePresence mode="wait" initial={false}>
              {loading ? (
                <motion.div
                  key="share-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={MENU_SWITCHER_EXIT_TRANSITION}
                  className="w-full"
                >
                  <Skeleton className="h-9 w-full rounded-md" />
                </motion.div>
              ) : activeMenu ? (
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
          </div>
        </div>
      </nav>
      <main className="mx-auto mt-6 max-w-xl px-4">
        <DashboardPage />
      </main>
      <Toaster />
    </>
  );
}

export default App;
