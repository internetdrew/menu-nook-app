import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.js";
import { storeSlugSchema } from "../../shared/storeSlug.js";

export type SlugAvailability =
  | { available: true; slug: string }
  | { available: false; slug: string; message: string };

const isUniqueViolation = (error: { code?: string | null } | null) =>
  error?.code === "23505";

export const isStoreSlugUniqueViolation = isUniqueViolation;

export const checkStoreSlugAvailability = async (
  supabase: SupabaseClient<Database>,
  slug: string,
  options: { excludeStoreId?: string } = {},
): Promise<SlugAvailability> => {
  const parsed = storeSlugSchema.safeParse(slug);

  if (!parsed.success) {
    return {
      available: false,
      slug,
      message: parsed.error.issues[0]?.message ?? "Invalid store link.",
    };
  }

  let query = supabase.from("stores").select("id").eq("menu_slug", parsed.data);

  if (options.excludeStoreId) {
    query = query.neq("id", options.excludeStoreId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return {
      available: false,
      slug: parsed.data,
      message: "That link is already taken.",
    };
  }

  return {
    available: true,
    slug: parsed.data,
  };
};
