alter table public.menu_category_items
add column tags text[];

alter table public.menu_category_items
add constraint menu_category_items_tags_count_check
check (tags is null or cardinality(tags) <= 5);
