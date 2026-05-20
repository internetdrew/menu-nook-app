import { ArrowLeft, Check, Circle, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { Button } from "@/components/ui/button";
import { CreateBusinessForm } from "./forms/CreateBusinessForm";
import { CreateMenuForm } from "./forms/CreateMenuForm";
import type { BusinessRecord, MenuRecord } from "@/types/menu";

interface OnboardingChecklistProps {
  business: BusinessRecord | null | undefined;
  menus: MenuRecord[] | null | undefined;
  onContinue: () => void;
}

const totalSteps = 2;
type OnboardingPanel = "checklist" | "businessForm" | "menuForm" | "success";

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
  business,
  menus,
  onContinue,
}: OnboardingChecklistProps) {
  const [panel, setPanel] = useState<OnboardingPanel>("checklist");
  const [measureRef, bounds] = useMeasure();
  const hasBusiness = !!business;
  const hasMenu = !!menus?.length;
  const completedSteps = Number(hasBusiness) + Number(hasMenu);
  const progress = completedSteps / totalSteps;
  const activeStep = hasBusiness ? "menu" : "business";

  useEffect(() => {
    if (hasBusiness && hasMenu) {
      setPanel("success");
      return;
    }

    if (
      (panel === "businessForm" && hasBusiness) ||
      (panel === "menuForm" && hasMenu)
    ) {
      setPanel("checklist");
    }
  }, [hasBusiness, hasMenu, panel]);

  const openPanel = (nextPanel: Exclude<OnboardingPanel, "checklist">) => {
    setPanel(nextPanel);
  };

  const returnToChecklist = () => {
    setPanel("checklist");
  };

  return (
    <motion.section
      aria-labelledby="onboarding-title"
      className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-sm"
      animate={{ height: bounds.height || "auto" }}
      transition={cardTransition}
    >
      <div ref={measureRef}>
        <AnimatePresence mode="popLayout" initial={false}>
          {panel === "checklist" ? (
            <motion.div
              key="checklist"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={panelTransition}
            >
              <div className="flex items-center justify-between gap-4 border-b border-neutral-200/70 bg-white px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <OnboardingProgressRing
                    completedSteps={completedSteps}
                    progress={progress}
                  />
                  <h1 id="onboarding-title" className="font-semibold">
                    Get Started
                  </h1>
                </div>
                <p className="shrink-0 text-sm text-[#807d78]">
                  {completedSteps} of {totalSteps} Completed
                </p>
              </div>

              <div className="divide-y divide-neutral-200/60">
                <OnboardingStep
                  title="Name your business"
                  isComplete={hasBusiness}
                  isActive={activeStep === "business"}
                  onSelect={() => openPanel("businessForm")}
                />

                <OnboardingStep
                  title="Name your first menu"
                  isComplete={hasMenu}
                  isActive={activeStep === "menu"}
                  isLocked={!hasBusiness}
                  onSelect={() => openPanel("menuForm")}
                />

                <div className="py-2.5 text-center text-sm font-medium text-[#807d78] select-none">
                  {completedSteps === 0
                    ? "Start with your business"
                    : completedSteps === 1
                      ? "Nice start, one step left"
                      : "You're ready to build your menu"}
                </div>
              </div>
            </motion.div>
          ) : panel === "success" ? (
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
              key={panel}
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={panelTransition}
            >
              <OnboardingFormPanel
                title={
                  panel === "businessForm"
                    ? "Name your business"
                    : "Name your first menu"
                }
                onBack={returnToChecklist}
              >
                {panel === "businessForm" ? (
                  <CreateBusinessForm onSuccess={returnToChecklist} />
                ) : (
                  <CreateMenuForm onSuccess={returnToChecklist} />
                )}
              </OnboardingFormPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function OnboardingProgressRing({
  completedSteps,
  progress,
}: {
  completedSteps: number;
  progress: number;
}) {
  const isComplete = completedSteps === totalSteps;

  return (
    <div
      className="relative grid size-7 shrink-0 place-items-center rounded-full"
      aria-label={`${completedSteps} of ${totalSteps} onboarding steps completed`}
    >
      <svg
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="13.5"
          fill="none"
          stroke="#f2eee3"
          strokeWidth="3"
        />
        <motion.circle
          cx="16"
          cy="16"
          r="13.5"
          fill="none"
          stroke="oklch(59.2% 0.249 0.584)"
          strokeLinecap="round"
          strokeWidth="3"
          initial={false}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.35, ease: [0.215, 0.61, 0.355, 1] }}
        />
      </svg>
      <div className="relative grid size-5 place-items-center rounded-full bg-transparent">
        {isComplete && <Check className="size-4" />}
      </div>
    </div>
  );
}

function OnboardingStep({
  title,
  isComplete,
  isActive,
  onSelect,
  isLocked = false,
}: {
  title: string;
  isComplete: boolean;
  isActive: boolean;
  onSelect: () => void;
  isLocked?: boolean;
}) {
  const isDisabled = isComplete || isLocked;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={`w-full bg-white px-5 py-3 text-left transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-white ${isLocked ? "opacity-55" : ""} `}
    >
      <div className="flex items-center gap-3">
        <div className="mt-0.5 grid size-7 shrink-0 place-items-center">
          {isComplete ? (
            <span className="grid size-6 place-items-center rounded-full bg-pink-600 text-white">
              <Check className="size-4" />
            </span>
          ) : (
            <Circle className="size-6 text-neutral-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2
              className={`text-base font-medium select-none ${
                isComplete
                  ? "text-[#9a8c85] line-through decoration-pink-600"
                  : "text-[#281513]"
              }`}
            >
              {title}
            </h2>
            {!isComplete && (
              <Play
                fill="currentColor"
                className={`size-3 shrink-0 ${
                  isActive ? "text-[#78665e]" : "text-neutral-300"
                }`}
              />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function OnboardingFormPanel({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 border-b border-neutral-200/70 bg-white px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-[#78665e]"
          onClick={onBack}
          aria-label="Back to onboarding checklist"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 id="onboarding-title" className="min-w-0 text-base font-semibold">
          {title}
        </h1>
      </div>
      <div className="px-5 py-5">{children}</div>
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
          You're good to go!
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
