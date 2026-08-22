import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth";
import { trpc } from "@/utils/trpc";

const HeaderTitle = () => {
  const { user } = useAuth();
  const { data: store } = useQuery(
    trpc.store.getForUser.queryOptions(undefined, {
      enabled: !!user,
    }),
  );
  const shouldReduceMotion = useReducedMotion();
  const appTitle = store?.name ?? "MenuNook";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.h1
        key={appTitle}
        className="title truncate font-[560]"
        initial={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 5, filter: "blur(4px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: -5, filter: "blur(4px)" }
        }
        transition={{
          duration: 0.18,
          ease: [0.215, 0.61, 0.355, 1],
        }}
        style={{ willChange: "transform, filter, opacity" }}
      >
        {appTitle}
      </motion.h1>
    </AnimatePresence>
  );
};

export default HeaderTitle;
