alter table if exists public.store_category_items
  drop constraint if exists menu_category_items_menu_category_id_fkey;

alter table if exists public.store_category_sort_indexes
  drop constraint if exists menu_category_sort_indexes_category_id_fkey;

alter table if exists public.store_category_item_sort_indexes
  drop constraint if exists menu_category_item_sort_indexes_menu_category_id_fkey;

alter table if exists public.store_category_item_sort_indexes
  drop constraint if exists menu_category_item_sort_indexes_menu_category_item_id_fkey;
