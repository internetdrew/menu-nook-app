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

export function SignInPrompt() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("Continue with Google");

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setButtonLabel("Connecting to Google...");

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setIsSigningIn(false);
      setButtonLabel("Continue with Google");
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
          onClick={handleSignIn}
          disabled={isSigningIn}
          aria-busy={isSigningIn}
        >
          {isSigningIn && <Spinner />}
          {buttonLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
