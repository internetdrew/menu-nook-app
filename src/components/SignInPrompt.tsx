import { AnimatedButtonContent } from "@/components/ui/animated-button-content";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import { useState } from "react";
import {
  motion,
  type Transition,
  useReducedMotion,
  useTime,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

const STATES = {
  idle: "Continue with Google",
  processing: "Connecting to Google...",
  error: "Something went wrong",
} as const;

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
        <AnimatedButtonContent
          state={buttonState}
          labels={STATES}
          shouldShake={buttonState === "error"}
          renderIcon={(state) => {
            if (state === "processing") return <Loader />;
            if (state === "error") return <X />;
            return null;
          }}
        />
      </Button>
    </section>
  );
}

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
