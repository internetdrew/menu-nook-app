import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Globe, LogOut, Settings, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStoreContext } from "@/contexts/StoreContext";
import { Button } from "../ui/button";
import FormDialog from "../dialogs/FormDialog";
import { StoreDetailsForm } from "../forms/StoreDetailsForm";
import { StoreDiscoveryForm } from "../forms/StoreDiscoveryForm";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";

type QuickActionDialog = "store" | "search";

const actionStagger = 0.035;

const itemTransition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
} as const;

const HomeQuickActions = () => {
  const prefersReducedMotion = useReducedMotion();
  const { store } = useStoreContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<QuickActionDialog | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (!target || !target.isConnected) return;
      if (containerRef.current?.contains(target)) return;

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  if (!store) {
    return null;
  }

  const openDialog = (dialog: QuickActionDialog) => {
    setActiveDialog(dialog);
    setIsOpen(false);
  };

  const handleLogOut = async () => {
    setIsOpen(false);

    try {
      await signOut();
    } catch (error) {
      console.error("Failed to log out:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const actions = [
    {
      label: "Search Appearance",
      icon: Globe,
      onSelect: () => openDialog("search"),
    },
    {
      label: "Store profile",
      icon: Store,
      onSelect: () => openDialog("store"),
    },
    {
      label: "Log out",
      icon: LogOut,
      onSelect: handleLogOut,
    },
  ];

  return (
    <>
      <div
        ref={containerRef}
        className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-8 sm:bottom-8"
      >
        <div className="flex flex-col items-end gap-2">
          <AnimatePresence initial={false}>
            {isOpen &&
              actions.map((action, index) => {
                const Icon = action.icon;
                const distanceFromButton = actions.length - 1 - index;
                const delay = distanceFromButton * actionStagger;

                return (
                  <motion.button
                    key={action.label}
                    type="button"
                    className="flex h-10 items-center gap-2 rounded-full border bg-white px-3 text-sm font-medium text-neutral-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none"
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, y: 10, scale: 0.94 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: 0, y: 10, scale: 0.94 }
                    }
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            ...itemTransition,
                            delay,
                          }
                    }
                    onClick={action.onSelect}
                  >
                    <Icon className="size-4" />
                    {action.label}
                  </motion.button>
                );
              })}
          </AnimatePresence>
        </div>

        <Button
          type="button"
          size="icon-lg"
          className="relative overflow-hidden rounded-full shadow-lg"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
          onClick={() => setIsOpen((current) => !current)}
        >
          <motion.span
            className="absolute grid size-4 place-items-center"
            aria-hidden="true"
            animate={
              prefersReducedMotion
                ? { opacity: isOpen ? 0 : 1 }
                : {
                    opacity: isOpen ? 0 : 1,
                    rotate: isOpen ? -45 : 0,
                    scale: isOpen ? 0.86 : 1,
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.1, ease: [0.25, 1, 0.5, 1] }
            }
          >
            <Settings className="size-4" />
          </motion.span>
          <motion.span
            className="absolute grid size-4 place-items-center"
            aria-hidden="true"
            animate={
              prefersReducedMotion
                ? { opacity: isOpen ? 1 : 0 }
                : {
                    opacity: isOpen ? 1 : 0,
                    rotate: isOpen ? 0 : -45,
                    scale: isOpen ? 1 : 0.86,
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.1, ease: [0.25, 1, 0.5, 1] }
            }
          >
            <X className="size-4" />
          </motion.span>
        </Button>
      </div>

      <FormDialog
        title="Search Appearance"
        description="Tune how your store appears in search results."
        isDialogOpen={activeDialog === "search"}
        setIsDialogOpen={(open) => setActiveDialog(open ? "search" : null)}
        formComponent={
          <StoreDiscoveryForm
            store={store}
            onSuccess={() => setActiveDialog(null)}
          />
        }
      />
      <FormDialog
        title="Store profile"
        description="Update the store name, link, and logo customers see."
        isDialogOpen={activeDialog === "store"}
        setIsDialogOpen={(open) => setActiveDialog(open ? "store" : null)}
        formComponent={
          <StoreDetailsForm
            store={store}
            onSuccess={() => setActiveDialog(null)}
          />
        }
      />
    </>
  );
};

export default HomeQuickActions;
