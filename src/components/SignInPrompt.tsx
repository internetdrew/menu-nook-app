import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import { Spinner } from "./ui/spinner";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export function SignInPrompt() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const buttonState = isSigningIn ? "loading" : "idle";
  const buttonLabel =
    buttonState === "loading"
      ? "Connecting to Google..."
      : "Continue with Google";

  const handleSignIn = async () => {
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setIsSigningIn(false);
    }
  };

  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-lg flex-col items-center text-center",
      )}
    >
      <h1 className="title mt-52 text-4xl leading-none font-bold text-stone-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.65)] md:mt-64 md:text-5xl">
        MenuNook
      </h1>
      <p className="mt-5 text-base leading-7 font-medium text-stone-700 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
        Sign in to give your menu a clean, <br />
        simple home of its own.
      </p>
      <Button
        className="relative mt-8 h-11 min-w-60 overflow-hidden bg-stone-950 text-white shadow-[0_14px_34px_rgba(61,45,29,0.24)] hover:bg-stone-800"
        onClick={handleSignIn}
        disabled={isSigningIn}
        aria-busy={isSigningIn}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            className="inline-flex items-center justify-center gap-2"
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
