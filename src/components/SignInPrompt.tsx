import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
  useTime,
  useTransform,
} from "motion/react";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";

const STATES = {
  idle: "Continue with Google",
  processing: "Connecting to Google...",
  error: "Something went wrong",
} as const;

const SPRING_CONFIG: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};

export function SignInPrompt() {
  const [buttonState, setButtonState] = useState<keyof typeof STATES>("idle");

  const handleSignIn = async () => {
    setButtonState("processing");

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setButtonState("error");
    }
  };

  return (
    <section
      className={cn(
        "mx-auto mt-44 flex w-full max-w-lg flex-col items-center text-center",
      )}
    >
      <p className="text-xl font-semibold text-pretty sm:text-2xl">
        Let's get your menu online.
      </p>
      <p className="mt-4 text-[15px] font-medium text-neutral-600">
        You'll have something to share in just a few minutes.
      </p>
      <Button
        className="relative mt-6 h-auto rounded-full bg-neutral-950 px-5 py-3 text-white hover:bg-neutral-900"
        onClick={handleSignIn}
        disabled={buttonState === "processing"}
        aria-busy={buttonState === "processing"}
      >
        <Badge state={buttonState} />
      </Button>
    </section>
  );
}

const Badge = ({ state }: { state: keyof typeof STATES }) => {
  const badgeRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!badgeRef.current || shouldReduceMotion) return;

    if (state === "error") {
      animate(
        badgeRef.current,
        { x: [0, -6, 6, -6, 0] },
        {
          duration: 0.3,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
          repeat: 0,
          delay: 0.1,
        },
      );
    }
  }, [state, shouldReduceMotion]);

  return (
    <motion.span
      ref={badgeRef}
      className="inline-flex items-center justify-center overflow-hidden rounded-full font-medium"
      animate={{
        gap: state === "idle" ? 0 : 8,
      }}
      transition={SPRING_CONFIG}
      style={{ willChange: "transform" }}
    >
      <Icon state={state} />
      <Label state={state} />
    </motion.span>
  );
};

const Icon = ({ state }: { state: keyof typeof STATES }) => {
  const shouldReduceMotion = useReducedMotion();
  const isIdle = state === "idle";

  return (
    <motion.span
      className="relative flex h-5 items-center justify-center overflow-hidden"
      animate={{ width: isIdle ? 0 : 20 }}
      transition={SPRING_CONFIG}
    >
      <AnimatePresence initial={false}>
        {!isIdle ? (
          <motion.span
            key={state}
            className="absolute top-0 left-0 flex size-5 items-center justify-center"
            initial={
              shouldReduceMotion
                ? false
                : { y: -40, scale: 0.5, filter: "blur(6px)" }
            }
            animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { y: 40, scale: 0.5, filter: "blur(6px)" }
            }
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            {state === "processing" ? <Loader /> : null}
            {state === "error" ? <X /> : null}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.span>
  );
};

const ICON_SIZE = 20;
const STROKE_WIDTH = 1.8;
const VIEW_BOX_SIZE = 24;

const svgProps = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  viewBox: `0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE_WIDTH,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const iconSpringConfig: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 20,
};

const pathAnimation = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: iconSpringConfig,
};

function Loader() {
  const time = useTime();
  const rotate = useTransform(time, [0, 1000], [0, 360], { clamp: false });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      className="flex size-5 items-center justify-center"
      style={{ rotate: shouldReduceMotion ? undefined : rotate }}
    >
      <motion.svg {...svgProps}>
        <motion.path d="M21 12a9 9 0 1 1-6.219-8.56" {...pathAnimation} />
      </motion.svg>
    </motion.span>
  );
}

function X() {
  return (
    <motion.svg {...svgProps}>
      <motion.line x1="6" y1="6" x2="18" y2="18" {...pathAnimation} />
      <motion.line
        x1="18"
        y1="6"
        x2="6"
        y2="18"
        {...pathAnimation}
        transition={{ ...iconSpringConfig, delay: 0.1 }}
      />
    </motion.svg>
  );
}

const Label = ({ state }: { state: keyof typeof STATES }) => {
  const [measureRef, bounds] = useMeasure();
  const shouldReduceMotion = useReducedMotion();
  const measuredWidth = Math.ceil(bounds.width);

  return (
    <motion.span
      layout
      style={{
        position: "relative",
        display: "inline-block",
        width: measuredWidth || "auto",
      }}
      animate={measuredWidth ? { width: measuredWidth } : undefined}
      transition={SPRING_CONFIG}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.span
          ref={measureRef}
          key={state}
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
          }}
          initial={
            shouldReduceMotion
              ? false
              : {
                  y: -20,
                  opacity: 0,
                  filter: "blur(10px)",
                  position: "absolute",
                }
          }
          animate={{
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            position: "relative",
          }}
          exit={
            shouldReduceMotion
              ? { opacity: 0, position: "absolute" }
              : {
                  y: 20,
                  opacity: 0,
                  filter: "blur(10px)",
                  position: "absolute",
                }
          }
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
        >
          {STATES[state]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
};
