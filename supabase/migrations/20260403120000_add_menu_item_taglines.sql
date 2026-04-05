alter table public.menu_category_items
add column tagline text;

update public.menu_category_items
set tagline = description
where tagline is null
  and description is not null;
