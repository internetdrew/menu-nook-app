import { z } from "zod";

export const MENU_SLUG_MIN_LENGTH = 3;
export const MENU_SLUG_MAX_LENGTH = 60;

export const RESERVED_MENU_SLUGS = [
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

const RESERVED_MENU_SLUG_SET: Set<string> = new Set(RESERVED_MENU_SLUGS);

export const MENU_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const menuSlugSchema = z
  .string()
  .trim()
  .min(
    MENU_SLUG_MIN_LENGTH,
    "Use at least 3 characters with lowercase letters, numbers, and hyphens.",
  )
  .max(
    MENU_SLUG_MAX_LENGTH,
    "Use at most 60 characters with lowercase letters, numbers, and hyphens.",
  )
  .regex(MENU_SLUG_REGEX, "Use only lowercase letters, numbers, and hyphens.")
  .refine((slug) => !RESERVED_MENU_SLUG_SET.has(slug), {
    message: "This link is reserved. Choose another one.",
  });

export const createMenuSlug = (text: string) => {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/['"’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MENU_SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");

  return slug;
};

export const createDefaultMenuSlug = (text: string) => {
  const baseSlug = createMenuSlug(text);

  if (!baseSlug) {
    return "menu";
  }

  if (!RESERVED_MENU_SLUG_SET.has(baseSlug)) {
    return baseSlug;
  }

  const reservedFallback = `${baseSlug}-menu`
    .slice(0, MENU_SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");

  return reservedFallback || "menu";
};
