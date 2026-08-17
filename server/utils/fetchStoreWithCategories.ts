import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.js";
import { TRPCError } from "@trpc/server";
import type { StoreRow } from "./storeTypes.js";

type FetchStoreInput =
  | { storeId: string; storeSlug?: never }
  | { storeSlug: string; storeId?: never };

type StoreCategoryRow =
  Database["public"]["Tables"]["store_menu_categories"]["Row"];
type StoreCategoryItemRow =
  Database["public"]["Tables"]["store_menu_category_items"]["Row"];
type StoreCategorySortIndexRow =
  Database["public"]["Tables"]["store_menu_category_sort_indexes"]["Row"];
type StoreCategoryItemSortIndexRow =
  Database["public"]["Tables"]["store_menu_category_item_sort_indexes"]["Row"];

type SortedStoreCategoryRow = StoreCategorySortIndexRow & {
  category: StoreCategoryRow & {
    items?: Array<
      StoreCategoryItemRow & {
        sort_index?: Pick<
          StoreCategoryItemSortIndexRow,
          "id" | "order_index"
        >[];
      }
    >;
  };
};

export async function fetchStoreWithCategories(
  supabase: SupabaseClient<Database>,
  input: FetchStoreInput,
) {
  let storeQuery = supabase.from("stores").select("*");

  if (input.storeId !== undefined) {
    storeQuery = storeQuery.eq("id", input.storeId);
  } else {
    storeQuery = storeQuery.eq("menu_slug", input.storeSlug);
  }

  const { data: store, error: storeError } = await storeQuery.maybeSingle();

  if (storeError) {
    console.error("Error fetching store:", storeError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch store: ${storeError.message}`,
    });
  }

  if (!store) {
    return null;
  }

  const { data: sortedCategories, error: catError } = await supabase
    .from("store_menu_category_sort_indexes")
    .select(
      `
      *,
      category:store_menu_categories(*, 
        items:store_menu_category_items(
          *,
          sort_index:store_menu_category_item_sort_indexes!smcis_item_id_fkey(id, order_index)
        )
      )
    `,
    )
    .eq("store_id", store.id)
    .order("order_index", { ascending: true });

  if (catError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch category sort order: ${catError.message}`,
    });
  }

  const categoriesWithSortedItems = (
    sortedCategories as unknown as SortedStoreCategoryRow[]
  ).map((row) => {
    const items =
      row.category.items
        ?.map((item) => {
          const { sort_index, ...rest } = item;
          return {
            ...rest,
            order_index: sort_index?.[0]?.order_index ?? 0,
            sort_index_id: sort_index?.[0]?.id ?? null,
          };
        })
        .sort((a, b) => a.order_index - b.order_index) ?? [];

    return {
      ...row.category,
      order_index: row.order_index,
      sort_index_id: row.id,
      items,
    };
  });

  return {
    ...(store as StoreRow),
    store_menu_categories: categoriesWithSortedItems,
  };
}
