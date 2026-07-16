import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import { Spinner } from "./ui/spinner";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export function SignInPrompt() {
  const [buttonState, setButtonState] = useState<"loading" | "idle" | "error">(
    "idle",
  );
  const buttonLabel =
    buttonState === "loading"
      ? "Connecting to Google..."
      : "Continue with Google";

  const handleSignIn = async () => {
    setButtonState("loading");

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
        className="relative mt-6 rounded-full bg-neutral-950 px-4 py-2 text-white"
        onClick={handleSignIn}
        disabled={buttonState === "loading"}
        aria-busy={buttonState === "loading"}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            className="inline-flex items-center justify-center gap-2 font-medium"
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            key={buttonState}
          >
            {buttonState === "loading" ? <Spinner /> : null}
            {buttonLabel}
          </motion.span>
        </AnimatePresence>
      </Button>
    </section>
  );
}
