import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from "motion/react";
import useMeasure from "react-use-measure";

const SPRING_CONFIG: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};

export function AnimatedButtonContent<State extends string>({
  state,
  labels,
  renderIcon,
  iconSize = 20,
  shouldShake = false,
}: {
  state: State;
  labels: Record<State, ReactNode>;
  renderIcon?: (state: State) => ReactNode;
  iconSize?: number;
  shouldShake?: boolean;
}) {
  const contentRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const icon = renderIcon?.(state) ?? null;

  useEffect(() => {
    if (!contentRef.current || shouldReduceMotion || !shouldShake) return;

    animate(
      contentRef.current,
      { x: [0, -6, 6, -6, 0] },
      {
        duration: 0.3,
        ease: "easeInOut",
        times: [0, 0.25, 0.5, 0.75, 1],
        repeat: 0,
        delay: 0.1,
      },
    );
  }, [shouldReduceMotion, shouldShake, state]);

  return (
    <motion.span
      ref={contentRef}
      className="inline-flex items-center justify-center overflow-hidden rounded-full font-medium"
      animate={{ gap: icon ? 8 : 0 }}
      transition={SPRING_CONFIG}
      style={{ willChange: "transform" }}
    >
      {icon ? <AnimatedButtonIcon icon={icon} iconSize={iconSize} /> : null}
      <AnimatedButtonLabel state={state}>{labels[state]}</AnimatedButtonLabel>
    </motion.span>
  );
}

function AnimatedButtonIcon({
  icon,
  iconSize,
}: {
  icon: ReactNode;
  iconSize: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className="relative flex items-center justify-center overflow-hidden"
      initial={{ width: 0 }}
      animate={{ width: iconSize }}
      exit={{ width: 0 }}
      transition={SPRING_CONFIG}
      style={{ height: iconSize }}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key="icon"
          className="absolute top-0 left-0 flex items-center justify-center"
          initial={
            shouldReduceMotion
              ? false
              : { y: -iconSize * 2, scale: 0.5, filter: "blur(6px)" }
          }
          animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { y: iconSize * 2, scale: 0.5, filter: "blur(6px)" }
          }
          transition={{ duration: 0.15, ease: "easeInOut" }}
          style={{ width: iconSize, height: iconSize }}
        >
          {icon}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

function AnimatedButtonLabel<State extends string>({
  state,
  children,
}: {
  state: State;
  children: ReactNode;
}) {
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
          {children}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
