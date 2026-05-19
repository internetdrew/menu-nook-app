alter table menu_category_items
drop column if exists primary_tag,
drop column if exists tags,
drop column if exists details;
