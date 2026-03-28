import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import { Spinner } from "./ui/spinner";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

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
    <Card className="mx-auto mt-40 max-w-md bg-neutral-300/20 shadow">
      <CardHeader className="text-center">
        <CardTitle className="title text-xl font-bold">MenuNook</CardTitle>
        <CardDescription className="mx-auto max-w-xs">
          Sign in to give your menu a clean, simple home of its own.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        <Button
          className="relative min-w-52 overflow-hidden"
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
      </CardFooter>
    </Card>
  );
}
