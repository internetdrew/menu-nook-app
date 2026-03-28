import { supabaseBrowserClient } from "@/lib/supabase";

export async function signInWithGoogle() {
  await supabaseBrowserClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
