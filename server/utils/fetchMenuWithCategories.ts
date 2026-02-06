import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../shared/database.types";
import { TRPCError } from "@trpc/server";

export async function fetchMenuWithCategories(
  supabase: SupabaseClient<Database>,
  menuId: string,
) {
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .select(
      `
      *,
      business:businesses(*)
    `,
    )
    .eq("id", menuId)
    .maybeSingle();

  if (menuError) {
    console.error("Error fetching menu:", menuError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch menu: ${menuError.message}`,
    });
  }

  if (!menu) {
    return null;
  }

  const { data: sortedCategories, error: catError } = await supabase
    .from("menu_category_sort_indexes")
    .select(
      `
      *,
      category:menu_categories(*, 
        items:menu_category_items(
          *,
          sort_index:menu_category_item_sort_indexes(order_index)
        )
      )
    `,
    )
    .eq("menu_id", menuId)
    .order("order_index", { ascending: true });

  if (catError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch category sort order: ${catError.message}`,
    });
  }

  const categoriesWithSortedItems = sortedCategories.map((row) => {
    const items =
      row.category.items
        ?.map((item) => {
          const { sort_index, ...rest } = item;
          return {
            ...rest,
            order_index: sort_index?.[0]?.order_index ?? 0,
          };
        })
        .sort((a, b) => a.order_index - b.order_index) ?? [];

    return {
      ...row.category,
      items,
    };
  });

  return {
    ...menu,
    menu_categories: categoriesWithSortedItems,
  };
}
