import { AnimatePresence, motion } from "motion/react";
import useMeasure from "react-use-measure";
import { CreateStoreForm } from "./forms/CreateStoreForm";

const cardTransition = {
  type: "spring",
  duration: 0.32,
  bounce: 0,
} as const;

const panelTransition = {
  duration: 0.2,
  ease: [0.215, 0.61, 0.355, 1],
} as const;

const panelVariants = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    y: -4,
    filter: "blur(4px)",
    transition: { duration: 0.14, ease: [0.26, 0.08, 0.25, 1] },
  },
} as const;

export function Onboarding() {
  const [measureRef, bounds] = useMeasure();

  return (
    <motion.section
      aria-labelledby="onboarding-title"
      className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-sm"
      animate={{ height: bounds.height || "auto" }}
      transition={cardTransition}
    >
      <div ref={measureRef}>
        <AnimatePresence mode="popLayout" initial={false}>
          {
            <motion.div
              key="storeForm"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={panelTransition}
            >
              <div className="border-b border-neutral-200/60 bg-white px-4 py-3">
                <h1 id="onboarding-title" className="text-sm font-medium">
                  Set up your store
                </h1>
              </div>
              <div className="p-4">
                <CreateStoreForm onSuccess={() => undefined} />
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
