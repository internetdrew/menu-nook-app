import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.js";
import {
  createDefaultStoreSlug,
  storeSlugSchema,
  STORE_SLUG_MAX_LENGTH,
} from "../../shared/storeSlug.js";

export type SlugAvailability =
  | { available: true; slug: string }
  | { available: false; slug: string; message: string };

const MAX_SUFFIX_ATTEMPTS = 100;

const buildSlugWithSuffix = (baseSlug: string, suffix: number) => {
  if (suffix <= 1) {
    return baseSlug;
  }

  const suffixText = suffix.toString();
  const suffixSeparator = "-";
  const maxBaseLength = Math.max(
    1,
    STORE_SLUG_MAX_LENGTH - suffixText.length - suffixSeparator.length,
  );

  return `${baseSlug.slice(0, maxBaseLength)}-${suffixText}`.replace(
    /-+/g,
    "-",
  );
};

const isUniqueViolation = (error: { code?: string | null } | null) =>
  error?.code === "23505";

export const isStoreSlugUniqueViolation = isUniqueViolation;

export const resolveUniqueStoreSlug = async (
  supabase: SupabaseClient<Database>,
  source: string,
  options: { excludeStoreId?: string } = {},
) => {
  const baseSlug = createDefaultStoreSlug(source);

  for (let suffix = 1; suffix <= MAX_SUFFIX_ATTEMPTS; suffix += 1) {
    const candidateSlug = buildSlugWithSuffix(baseSlug, suffix);
    let query = supabase
      .from("stores")
      .select("id")
      .eq("menu_slug", candidateSlug);

    if (options.excludeStoreId) {
      query = query.neq("id", options.excludeStoreId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return candidateSlug;
    }
  }

  throw new Error("Unable to allocate a unique store slug.");
};

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
