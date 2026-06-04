alter table public.businesses
add column if not exists seo_title text,
add column if not exists seo_description text;
