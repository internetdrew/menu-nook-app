import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";

const SPRING_CONFIG = {
  type: "spring",
  stiffness: 600,
  damping: 30,
} as const;

export function AnimatedSubmitButton({
  isSubmitting,
  idleLabel,
  submittingLabel = "Sending...",
}: {
  isSubmitting: boolean;
  idleLabel: string;
  submittingLabel?: string;
}) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className="min-w-24 overflow-hidden"
    >
      <motion.span
        className="inline-flex items-center justify-center overflow-hidden"
        animate={{ gap: isSubmitting ? 8 : 0 }}
        transition={SPRING_CONFIG}
      >
        <motion.span
          aria-hidden="true"
          className="relative flex h-4 items-center justify-center overflow-hidden"
          animate={{ width: isSubmitting ? 16 : 0 }}
          transition={SPRING_CONFIG}
        >
          <AnimatePresence initial={false}>
            {isSubmitting && (
              <motion.span
                key="spinner"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ y: -16, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: 16, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.16, ease: "easeInOut" }}
              >
                <LoadingSpinner size="button" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={isSubmitting ? "submitting" : "idle"}
            className="block whitespace-nowrap"
            initial={{ y: -12, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 12, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            {isSubmitting ? submittingLabel : idleLabel}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </Button>
  );
}
