import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../server";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type StoreRecord = NonNullable<RouterOutput["store"]["getForUser"]>;

export type StorePreviewData = NonNullable<RouterOutput["store"]["getPreview"]>;

export type StorePreviewCategory =
  StorePreviewData["store_menu_categories"][number];

export type StorePreviewItem = StorePreviewCategory["items"][number];

export type StoreCategoryRecord = NonNullable<
  RouterOutput["storeCategory"]["getById"]
>;

export type StoreItemRecord = RouterOutput["storeCategoryItem"]["delete"];

export type CategoryIndex =
  RouterOutput["storeCategory"]["getAllSortedByIndex"][number];

export type StoreCategorySortIndexRecord = Omit<CategoryIndex, "category">;

export type ItemIndex =
  RouterOutput["storeCategoryItem"]["getSortedForCategory"][number];

export type StoreItemWithCategory = ItemIndex["item"];

export type StoreItemSortIndexRecord = Omit<ItemIndex, "item">;

export type ItemTableRow = StoreItemWithCategory;
