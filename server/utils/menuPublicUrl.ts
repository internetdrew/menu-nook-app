import type { MenuRow } from "./menuTypes.js";

const PUBLIC_MENU_DOMAIN =
  process.env.VITE_PUBLIC_MENU_DOMAIN || "https://menunook.com";

export const buildStableMenuPublicUrl = (menu: Pick<MenuRow, "id">) =>
  `${PUBLIC_MENU_DOMAIN}/m/${menu.id}`;

export const buildShareMenuPublicUrl = (menu: Pick<MenuRow, "id" | "slug">) =>
  `${PUBLIC_MENU_DOMAIN}/m/${menu.slug ?? menu.id}`;
