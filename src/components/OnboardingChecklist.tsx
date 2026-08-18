import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { Button } from "@/components/ui/button";
import { CreateStoreForm } from "./forms/CreateStoreForm";
import type { StoreRecord } from "@/types/store";

interface OnboardingChecklistProps {
  store: StoreRecord | null | undefined;
  onContinue: () => void;
}

type OnboardingPanel = "storeForm" | "success";

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

export function OnboardingChecklist({
  store,
  onContinue,
}: OnboardingChecklistProps) {
  const [panel, setPanel] = useState<OnboardingPanel>(
    store ? "success" : "storeForm",
  );
  const [measureRef, bounds] = useMeasure();
  const hasStore = !!store;

  useEffect(() => {
    setPanel(hasStore ? "success" : "storeForm");
  }, [hasStore]);

  return (
    <motion.section
      aria-labelledby="onboarding-title"
      className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-sm"
      animate={{ height: bounds.height || "auto" }}
      transition={cardTransition}
    >
      <div ref={measureRef}>
        <AnimatePresence mode="popLayout" initial={false}>
          {panel === "success" ? (
            <motion.div
              key="success"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={panelTransition}
            >
              <OnboardingSuccessPanel onContinue={onContinue} />
            </motion.div>
          ) : (
            <motion.div
              key="storeForm"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={panelTransition}
            >
              <OnboardingFormPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function OnboardingPanelHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className="border-b border-neutral-200/60 bg-white px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <h1
          id="onboarding-title"
          className="min-w-0 text-sm font-medium text-[#281513]"
        >
          {title}
        </h1>
      </div>
    </div>
  );
}

function OnboardingFormPanel() {
  return (
    <div>
      <OnboardingPanelHeader title="Set up your store" />
      <div className="px-5 py-5">
        <CreateStoreForm onSuccess={() => undefined} />
      </div>
    </div>
  );
}

function OnboardingSuccessPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="px-6 py-8 text-center">
      <motion.div
        className="mx-auto grid size-8 place-items-center rounded-full bg-pink-600 text-white shadow-sm"
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.36, bounce: 0.18 }}
      >
        <Check className="size-5" />
      </motion.div>

      <div className="mt-6 space-y-2">
        <h1 id="onboarding-title" className="text-xl font-semibold">
          You're all set!
        </h1>
        <p className="text-sm leading-6 text-[#807d78]">
          Everything is set up and ready.
          <br />
          You're ready to build your food page.
        </p>
      </div>

      <Button
        type="button"
        className="mt-8 w-3/4 rounded-full text-base"
        onClick={onContinue}
      >
        Continue
      </Button>
    </div>
  );
}
