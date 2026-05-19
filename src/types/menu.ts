import type { Database } from "../../shared/database.types";

export type BusinessRecord = Database["public"]["Tables"]["businesses"]["Row"];
export type MenuRecord = Database["public"]["Tables"]["menus"]["Row"];
export type MenuCategoryRecord =
  Database["public"]["Tables"]["menu_categories"]["Row"];
export type MenuCategorySortIndexRecord =
  Database["public"]["Tables"]["menu_category_sort_indexes"]["Row"];
export type MenuItemRecord =
  Database["public"]["Tables"]["menu_category_items"]["Row"];
export type MenuItemSortIndexRecord =
  Database["public"]["Tables"]["menu_category_item_sort_indexes"]["Row"];

export type MenuItemWithCategory = MenuItemRecord & {
  category: Pick<MenuCategoryRecord, "id" | "name">;
};

export type MenuPreviewItem = MenuItemRecord & {
  order_index: number;
  sort_index_id: number | null;
};

export type MenuPreviewCategory = MenuCategoryRecord & {
  order_index: number;
  sort_index_id: number | null;
  items: MenuPreviewItem[];
};

export type MenuPreviewData = MenuRecord & {
  business: BusinessRecord;
  menu_categories: MenuPreviewCategory[];
};

export type CategoryIndex = MenuCategorySortIndexRecord & {
  category: MenuCategoryRecord;
};

export type ItemIndex = MenuItemSortIndexRecord & {
  item: MenuItemWithCategory;
};

export type ItemTableRow = MenuItemRecord & {
  category: Pick<MenuCategoryRecord, "name"> | null;
};
