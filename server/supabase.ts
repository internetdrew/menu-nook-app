import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import type { Database } from "../shared/database.types.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const serverDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(serverDir, "../.env"), quiet: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const createServerSupabaseClient = (req: Request, res: Response) => {
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return Object.keys(req.cookies).map((name) => ({
          name,
          value: req.cookies[name] || "",
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          res.appendHeader(
            "Set-Cookie",
            serializeCookieHeader(name, value, options),
          ),
        );
      },
    },
  });
};

const supabaseAdminKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseAdminKey) {
  throw new Error("Missing Supabase admin key");
}

export const supabaseAdminClient = createClient<Database>(
  supabaseUrl,
  supabaseAdminKey,
);
