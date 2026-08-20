import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { StoreItem } from "@/pages/StorePage";

interface ItemImageDialogProps {
  selectedItem: StoreItem | null;
  setSelectedItem: (item: ItemImageDialogProps["selectedItem"]) => void;
}

const ItemImageDialog = ({
  selectedItem,
  setSelectedItem,
}: ItemImageDialogProps) => {
  const prefersReducedMotion = useReducedMotion();
  const layoutTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, bounce: 0.1, visualDuration: 0.125 };

  return (
    <Dialog.Root
      open={!!selectedItem}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedItem(null);
        }
      }}
    >
      <AnimatePresence>
        {selectedItem && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 0.16,
                }}
              />
            </Dialog.Overlay>
            <motion.div
              layoutRoot
              className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4"
            >
              <Dialog.Content forceMount asChild>
                <motion.div
                  className="relative my-auto w-full max-w-lg overflow-visible bg-transparent outline-none"
                  style={{
                    aspectRatio: "4 / 3",
                  }}
                >
                  <Dialog.Title className="sr-only">
                    {selectedItem.name} image
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Full-size item image.
                  </Dialog.Description>
                  {selectedItem.image_url && (
                    <motion.img
                      layoutId={`store-item-image-${selectedItem.id}`}
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      decoding="async"
                      className="object-cover"
                      style={{
                        aspectRatio: "4 / 3",
                        borderRadius: 12,
                        boxShadow:
                          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                        height: "100%",
                        width: "100%",
                      }}
                      transition={{ layout: layoutTransition }}
                    />
                  )}
                  <Dialog.Close asChild>
                    <motion.button
                      type="button"
                      className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white/70 text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none"
                      aria-label="Close image"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: {
                          opacity: 0,
                          transition: {
                            duration: prefersReducedMotion ? 0.01 : 0,
                          },
                        },
                        visible: {
                          opacity: 1,
                          transition: {
                            duration: prefersReducedMotion ? 0.01 : 0.1,
                            delay: prefersReducedMotion ? 0 : 0.15,
                          },
                        },
                      }}
                    >
                      <X className="size-4" />
                    </motion.button>
                  </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </motion.div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default ItemImageDialog;
