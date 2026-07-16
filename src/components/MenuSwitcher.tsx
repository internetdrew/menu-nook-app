import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "motion/react";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { MENU_SWITCHER_ENTER_TRANSITION } from "@/constants";
import { Skeleton } from "./ui/skeleton";

export function MenuSwitcher() {
  const navigate = useNavigate();
  const { menus, activeMenu, setActiveMenu, loading } = useMenuContext();

  return (
    <div className="w-40 max-w-64">
      {loading ? (
        <Skeleton className="h-9 w-full rounded-md" />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="menu-switcher"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={MENU_SWITCHER_ENTER_TRANSITION}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="justify-start px-2 hover:bg-stone-200 focus-visible:bg-stone-200"
                >
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
        </AnimatePresence>
      )}
    </div>
  );
}
