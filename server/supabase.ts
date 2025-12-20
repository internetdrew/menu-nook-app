import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import type { Database } from "../shared/database.types";
import dotenv from "dotenv";
import path from "path";

const baseDir: string =
  typeof __dirname !== "undefined" ? __dirname : process.cwd();

dotenv.config({ path: path.resolve(baseDir, "../.env") });

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
            serializeCookieHeader(name, value, {
              ...options,
              domain: ".menunook.com",
              path: "/",
              secure: true,
              httpOnly: options?.httpOnly ?? true,
              sameSite: "lax",
            }),
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
