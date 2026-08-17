import { supabaseBrowserClient } from "@/lib/supabase";

export const getLoaderUser = async () => {
  const sessionResult = await supabaseBrowserClient.auth.getSession();

  return sessionResult?.data?.session?.user ?? null;
};
