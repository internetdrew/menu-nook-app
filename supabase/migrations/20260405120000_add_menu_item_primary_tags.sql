alter table public.menu_category_items
add column primary_tag text;

alter table public.menu_category_items
add constraint menu_category_items_primary_tag_length_check
check (primary_tag is null or char_length(primary_tag) <= 16);
