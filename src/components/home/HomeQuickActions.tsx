import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus, Settings, Store, Trash2, Utensils, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { Button } from "../ui/button";
import FormDialog from "../dialogs/FormDialog";
import { CreateMenuForm } from "../forms/CreateMenuForm";
import { BusinessSettingsForm } from "../forms/BusinessSettingsForm";
import { MenuSettingsForm } from "../forms/MenuSettingsForm";
import DeleteMenuAlertDialog from "../dialogs/DeleteMenuAlertDialog";

type QuickActionDialog = "business" | "menu" | "createMenu" | "deleteMenu";

const itemTransition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
} as const;

const buttonTransition = {
  type: "spring",
  stiffness: 500,
  damping: 32,
} as const;

const HomeQuickActions = () => {
  const prefersReducedMotion = useReducedMotion();
  const { activeMenu, setActiveMenu } = useMenuContext();
  const { data: business } = useQuery(trpc.business.getForUser.queryOptions());
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

  if (!business || !activeMenu) {
    return null;
  }

  const openDialog = (dialog: QuickActionDialog) => {
    setActiveDialog(dialog);
    setIsOpen(false);
  };

  const actions = [
    {
      label: "Business profile",
      icon: Store,
      onSelect: () => openDialog("business"),
    },
    {
      label: "Rename menu",
      icon: Utensils,
      onSelect: () => openDialog("menu"),
    },
    {
      label: "Add menu",
      icon: Plus,
      onSelect: () => openDialog("createMenu"),
    },
    {
      label: "Delete menu",
      icon: Trash2,
      onSelect: () => openDialog("deleteMenu"),
      destructive: true,
    },
  ];

  return (
    <>
      <div
        ref={containerRef}
        className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3"
      >
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="quick-actions"
              className="flex flex-col items-end gap-2"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.12 }}
            >
              {actions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <motion.button
                    key={action.label}
                    type="button"
                    className={`flex h-10 items-center gap-2 rounded-full border bg-white px-3 text-sm font-medium shadow-sm backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      action.destructive
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-neutral-900 hover:bg-neutral-50"
                    }`}
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, y: 8, scale: 0.96 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: 0, y: 8, scale: 0.96 }
                    }
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            ...itemTransition,
                            delay: index * 0.035,
                          }
                    }
                    onClick={action.onSelect}
                  >
                    <Icon className="size-4" />
                    {action.label}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { width: isOpen ? 48 : 116, rotate: isOpen ? 45 : 0 }
          }
          transition={buttonTransition}
          className="overflow-hidden rounded-full"
          style={{ width: prefersReducedMotion ? undefined : 116 }}
        >
          <Button
            type="button"
            size="lg"
            className={`h-12 w-full rounded-full px-4 shadow-lg ${
              isOpen ? "justify-center px-0" : ""
            }`}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? (
              <X className="size-4 rotate-45" />
            ) : (
              <Settings className="size-4" />
            )}
            <AnimatePresence initial={false}>
              {!isOpen && (
                <motion.span
                  key="actions-label"
                  className="overflow-hidden whitespace-nowrap"
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, width: 0 }
                  }
                  animate={{ opacity: 1, width: "auto" }}
                  exit={
                    prefersReducedMotion ? undefined : { opacity: 0, width: 0 }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.14, ease: [0.25, 1, 0.5, 1] }
                  }
                >
                  Actions
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>

      <FormDialog
        title="Business profile"
        description="Update the business name customers see on your menu."
        isDialogOpen={activeDialog === "business"}
        setIsDialogOpen={(open) => setActiveDialog(open ? "business" : null)}
        formComponent={
          <BusinessSettingsForm
            business={business}
            onSuccess={() => setActiveDialog(null)}
          />
        }
      />

      <FormDialog
        title="Menu settings"
        description="Rename the current menu."
        isDialogOpen={activeDialog === "menu"}
        setIsDialogOpen={(open) => setActiveDialog(open ? "menu" : null)}
        formComponent={
          <MenuSettingsForm
            menu={activeMenu}
            onSuccess={(updatedMenu) => {
              setActiveMenu(updatedMenu);
              setActiveDialog(null);
            }}
          />
        }
      />

      <FormDialog
        title="Create a new menu"
        description="Add another menu for this business."
        isDialogOpen={activeDialog === "createMenu"}
        setIsDialogOpen={(open) => setActiveDialog(open ? "createMenu" : null)}
        formComponent={
          <CreateMenuForm onSuccess={() => setActiveDialog(null)} />
        }
      />

      <DeleteMenuAlertDialog
        menu={activeMenu}
        open={activeDialog === "deleteMenu"}
        onOpenChange={(open) => setActiveDialog(open ? "deleteMenu" : null)}
        onDeleted={() => setActiveDialog(null)}
        showTrigger={false}
      />
    </>
  );
};

export default HomeQuickActions;
