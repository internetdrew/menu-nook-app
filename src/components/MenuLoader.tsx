import { motion, useReducedMotion } from "motion/react";

const loaderRows = [
  { dot: "bg-rose-300", width: "w-16" },
  { dot: "bg-amber-300", width: "w-20" },
  { dot: "bg-emerald-300", width: "w-14" },
  { dot: "bg-sky-300", width: "w-18" },
] as const;

const writeLoopDuration = 2.4;
const rowDelay = 0.28;

export function MenuLoader() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-label="Loading MenuNook"
      className="grid h-dvh w-full place-items-center bg-[#fffefb] px-4"
    >
      <motion.div
        className="w-36 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="h-3 w-20 rounded-sm bg-neutral-900" />
          <motion.div
            aria-hidden="true"
            className="grid size-4 grid-cols-2 gap-0.5"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [1, 1.08, 1],
                    opacity: [0.6, 1, 0.6],
                  }
            }
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="rounded-[1px] bg-neutral-900" />
            <span className="rounded-[1px] bg-neutral-300" />
            <span className="rounded-[1px] bg-neutral-300" />
            <span className="rounded-[1px] bg-neutral-900" />
          </motion.div>
        </div>

        <div className="space-y-3">
          {loaderRows.map((row, index) => (
            <motion.div
              key={row.width}
              className="flex items-center gap-2"
              initial={shouldReduceMotion ? false : { opacity: 0.36 }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: [0.36, 1, 1, 0.36],
                    }
              }
              transition={{
                duration: writeLoopDuration,
                delay: index * rowDelay,
                repeat: Infinity,
                times: [0, 0.18, 0.72, 1],
                ease: [0.215, 0.61, 0.355, 1],
              }}
            >
              <span className={`size-2 rounded-full ${row.dot}`} />
              <span className={`block overflow-hidden rounded-sm ${row.width}`}>
                <motion.span
                  className="block h-2 rounded-sm bg-neutral-200"
                  initial={shouldReduceMotion ? false : { scaleX: 0 }}
                  animate={
                    shouldReduceMotion ? undefined : { scaleX: [0, 1, 1, 0] }
                  }
                  transition={{
                    duration: writeLoopDuration,
                    delay: index * rowDelay,
                    repeat: Infinity,
                    times: [0, 0.28, 0.76, 1],
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  style={{ originX: 0 }}
                />
              </span>
              <span className="ml-auto block w-5 overflow-hidden rounded-sm">
                <motion.span
                  className="block h-2 rounded-sm bg-neutral-200"
                  initial={shouldReduceMotion ? false : { scaleX: 0 }}
                  animate={
                    shouldReduceMotion ? undefined : { scaleX: [0, 1, 1, 0] }
                  }
                  transition={{
                    duration: writeLoopDuration,
                    delay: index * rowDelay + 0.12,
                    repeat: Infinity,
                    times: [0, 0.24, 0.74, 1],
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  style={{ originX: 0 }}
                />
              </span>
            </motion.div>
          ))}
        </div>

        <span className="sr-only">Loading</span>
      </motion.div>
    </div>
  );
}
