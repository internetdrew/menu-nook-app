import type { Database } from "../../shared/database.types";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseBrowserClient = createBrowserClient<Database>(
  supabaseUrl,
  supabaseKey,
);
