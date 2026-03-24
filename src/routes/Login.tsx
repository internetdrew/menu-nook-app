import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { title } from "@/constants";
import { supabaseBrowserClient } from "@/lib/supabase";

const Login = () => {
  const signInWithGoogle = async () => {
    try {
      await supabaseBrowserClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-dvh w-full bg-stone-200">
      <div className="mx-auto max-w-screen-xl px-4">
        <nav className="py-4">
          <div className="font-semibold">{title}</div>
        </nav>
        <Card className="mx-auto mt-28 max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to {title}</CardTitle>
            <CardDescription>
              Sign in to manage menus, categories, items, and QR sharing.
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-6 flex justify-center">
            <Button onClick={signInWithGoogle}>Continue with Google</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
