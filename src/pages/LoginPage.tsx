import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const STATES = {
  idle: "Continue with Google",
  processing: "Connecting to Google...",
} as const;

const loginContainerVariants = {
  initial: {},
  animate: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.05,
    },
  },
} as const;

const loginItemVariants = {
  initial: (shouldReduceMotion: boolean) =>
    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.215, 0.61, 0.355, 1],
    },
  },
} as const;

const Login = () => {
  const [buttonState, setButtonState] = useState<keyof typeof STATES>("idle");
  const shouldReduceMotion = useReducedMotion();

  const handleSignIn = async () => {
    setButtonState("processing");

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setButtonState("idle");
    }
  };

  return (
    <motion.div
      custom={shouldReduceMotion}
      variants={loginContainerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.h1
        className="menu-header mt-32 text-center text-xl font-[560]"
        variants={loginItemVariants}
      >
        Welcome to MenuNook
      </motion.h1>

      <main className="mt-36">
        <section
          className={cn(
            "mx-auto flex w-full max-w-lg flex-col items-center text-center",
          )}
        >
          <motion.p
            className="text-lg font-semibold text-pretty"
            variants={loginItemVariants}
          >
            Let's get your menu online.
          </motion.p>
          <motion.p
            className="text-[15px] font-medium text-neutral-600"
            variants={loginItemVariants}
          >
            You'll have something to share in just a few minutes.
          </motion.p>
          <motion.div
            className="mt-4"
            variants={loginItemVariants}
            style={{ willChange: shouldReduceMotion ? undefined : "transform" }}
          >
            <Button
              className="relative overflow-hidden"
              onClick={handleSignIn}
              disabled={buttonState === "processing"}
              aria-disabled={buttonState === "processing"}
              aria-busy={buttonState === "processing"}
              aria-label={STATES[buttonState]}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                  }
                  key={buttonState}
                >
                  {STATES[buttonState]}
                </motion.span>
              </AnimatePresence>
            </Button>
          </motion.div>
        </section>
      </main>
    </motion.div>
  );
};

export default Login;
