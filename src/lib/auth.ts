import { supabaseBrowserClient } from "@/lib/supabase";

export async function signInWithGoogle() {
  await supabaseBrowserClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  const { error } = await supabaseBrowserClient.auth.signOut();

  if (error) {
    throw error;
  }
}
