import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.js";
import {
  createDefaultMenuSlug,
  menuSlugSchema,
  MENU_SLUG_MAX_LENGTH,
} from "../../shared/menuSlug.js";

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
    MENU_SLUG_MAX_LENGTH - suffixText.length - suffixSeparator.length,
  );

  return `${baseSlug.slice(0, maxBaseLength)}-${suffixText}`.replace(
    /-+/g,
    "-",
  );
};

const isUniqueViolation = (error: { code?: string | null } | null) =>
  error?.code === "23505";

export const isMenuSlugUniqueViolation = isUniqueViolation;

export const resolveUniqueMenuSlug = async (
  supabase: SupabaseClient<Database>,
  source: string,
  options: { excludeMenuId?: string } = {},
) => {
  const baseSlug = createDefaultMenuSlug(source);

  for (let suffix = 1; suffix <= MAX_SUFFIX_ATTEMPTS; suffix += 1) {
    const candidateSlug = buildSlugWithSuffix(baseSlug, suffix);
    let query = supabase.from("menus").select("id").eq("slug", candidateSlug);

    if (options.excludeMenuId) {
      query = query.neq("id", options.excludeMenuId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return candidateSlug;
    }
  }

  throw new Error("Unable to allocate a unique menu slug.");
};

export const checkMenuSlugAvailability = async (
  supabase: SupabaseClient<Database>,
  slug: string,
  options: { excludeMenuId?: string } = {},
): Promise<SlugAvailability> => {
  const parsed = menuSlugSchema.safeParse(slug);

  if (!parsed.success) {
    return {
      available: false,
      slug,
      message: parsed.error.issues[0]?.message ?? "Invalid menu link.",
    };
  }

  let query = supabase.from("menus").select("id").eq("slug", parsed.data);

  if (options.excludeMenuId) {
    query = query.neq("id", options.excludeMenuId);
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
