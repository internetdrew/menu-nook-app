import type { StoreRow } from "./storeTypes.js";

const PUBLIC_STORE_DOMAIN =
  process.env.VITE_PUBLIC_STORE_DOMAIN ||
  process.env.VITE_PUBLIC_MENU_DOMAIN ||
  "https://menunook.com";

export const buildStorePublicUrl = (store: Pick<StoreRow, "menu_slug">) =>
  `${PUBLIC_STORE_DOMAIN}/m/${store.menu_slug}`;
