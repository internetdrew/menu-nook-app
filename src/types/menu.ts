import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../server";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type BusinessRecord = NonNullable<
  RouterOutput["business"]["getForUser"]
>;

export type MenuRecord = RouterOutput["menu"]["getAllForBusiness"][number];

export type MenuPreviewData = NonNullable<RouterOutput["menu"]["getPreview"]>;

export type MenuPreviewCategory = MenuPreviewData["menu_categories"][number];

export type MenuPreviewItem = MenuPreviewCategory["items"][number];

export type MenuCategoryRecord = NonNullable<
  RouterOutput["menuCategory"]["getById"]
>;

export type MenuItemRecord = RouterOutput["menuCategoryItem"]["delete"];

export type CategoryIndex =
  RouterOutput["menuCategory"]["getAllSortedByIndex"][number];

export type MenuCategorySortIndexRecord = Omit<CategoryIndex, "category">;

export type ItemIndex =
  RouterOutput["menuCategoryItem"]["getSortedForCategory"][number];

export type MenuItemWithCategory = ItemIndex["item"];

export type MenuItemSortIndexRecord = Omit<ItemIndex, "item">;

export type ItemTableRow = MenuItemWithCategory;
