import type { Database } from "../../shared/database.types.js";

export type MenuRow = Database["public"]["Tables"]["menus"]["Row"] & {
  slug: string | null;
};

export type MenuInsert = Database["public"]["Tables"]["menus"]["Insert"] & {
  slug?: string | null;
};

export type MenuUpdate = Database["public"]["Tables"]["menus"]["Update"] & {
  slug?: string | null;
};

export type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
