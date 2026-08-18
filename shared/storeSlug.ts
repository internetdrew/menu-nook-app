import { z } from "zod";

export const STORE_SLUG_MIN_LENGTH = 3;
export const STORE_SLUG_MAX_LENGTH = 60;

export const RESERVED_STORE_SLUGS = [
  "new",
  "edit",
  "admin",
  "login",
  "signup",
  "settings",
  "pricing",
  "api",
  "www",
  "app",
  "help",
  "support",
] as const;

const RESERVED_STORE_SLUG_SET: Set<string> = new Set(RESERVED_STORE_SLUGS);

export const STORE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const storeSlugSchema = z
  .string()
  .trim()
  .min(
    STORE_SLUG_MIN_LENGTH,
    "Use at least 3 characters with lowercase letters, numbers, and hyphens.",
  )
  .max(
    STORE_SLUG_MAX_LENGTH,
    "Use at most 60 characters with lowercase letters, numbers, and hyphens.",
  )
  .regex(STORE_SLUG_REGEX, "Use only lowercase letters, numbers, and hyphens.")
  .refine((slug) => !RESERVED_STORE_SLUG_SET.has(slug), {
    message: "This link is reserved. Choose another one.",
  });

export const createStoreSlug = (text: string) => {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/['"’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, STORE_SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");

  return slug;
};

export const createEditableStoreSlug = (text: string) => {
  const slug = text
    .toLowerCase()
    .replace(/['"’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "")
    .slice(0, STORE_SLUG_MAX_LENGTH)
    .replace(/^-+/g, "");

  return slug;
};

export const createDefaultStoreSlug = (text: string) => {
  const baseSlug = createStoreSlug(text);

  if (!baseSlug) {
    return "store";
  }

  if (!RESERVED_STORE_SLUG_SET.has(baseSlug)) {
    return baseSlug;
  }

  const reservedFallback = `${baseSlug}-store`
    .slice(0, STORE_SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");

  return reservedFallback || "store";
};
