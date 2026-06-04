import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Globe,
  Plus,
  Settings,
  Store,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { Button } from "../ui/button";
import FormDialog from "../dialogs/FormDialog";
import { CreateMenuForm } from "../forms/CreateMenuForm";
import { MenuSettingsForm } from "../forms/MenuSettingsForm";
import DeleteMenuAlertDialog from "../dialogs/DeleteMenuAlertDialog";
import { BusinessDetailsForm } from "../forms/BusinessDetailsForm";
import { BusinessDiscoveryForm } from "../forms/BusinessDiscoveryForm";

type QuickActionDialog =
  | "business"
  | "menu"
  | "createMenu"
  | "deleteMenu"
  | "search";

const actionStagger = 0.035;

const itemTransition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
} as const;

const HomeQuickActions = () => {
  const prefersReducedMotion = useReducedMotion();
  const { activeMenu, setActiveMenu } = useMenuContext();
  const { data: business, isLoading } = useQuery(
    trpc.business.getForUser.queryOptions(),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<QuickActionDialog | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const { isLoading: menuPreviewLoading } = useQuery(
    trpc.menu.getPreview.queryOptions(
      { menuId: activeMenu?.id ?? "" },
      { enabled: !!activeMenu },
    ),
  );

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
      label: "Search Appearance",
      icon: Globe,
      onSelect: () => openDialog("search"),
    },
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

  if (isLoading || menuPreviewLoading) {
    return null;
  }

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
                    className={`flex h-10 items-center gap-2 rounded-full border bg-white px-3 text-sm font-medium shadow-sm backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      action.destructive
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-neutral-900 hover:bg-neutral-50"
                    }`}
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
        description="Tune how your business appears in search results."
        isDialogOpen={activeDialog === "search"}
        setIsDialogOpen={(open) => setActiveDialog(open ? "business" : null)}
        formComponent={
          <BusinessDiscoveryForm
            business={business}
            onSuccess={() => setActiveDialog(null)}
          />
        }
      />
      <FormDialog
        title="Business profile"
        description="Update the business name and logo customers see on your menu."
        isDialogOpen={activeDialog === "business"}
        setIsDialogOpen={(open) => setActiveDialog(open ? "business" : null)}
        formComponent={
          <BusinessDetailsForm
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
