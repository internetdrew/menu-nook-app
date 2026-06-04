alter table public.menus
add column if not exists slug text;

do $$
declare
  menu_record record;
  base_slug text;
  candidate_slug text;
  slug_suffix integer;
begin
  for menu_record in
    select id, name
    from public.menus
    where slug is null
    order by created_at, id
  loop
    base_slug := lower(trim(coalesce(menu_record.name, '')));
    base_slug := regexp_replace(base_slug, '[''""’]+', '', 'g');
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');
    base_slug := left(base_slug, 60);
    base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');

    if base_slug = '' then
      base_slug := 'menu';
    end if;

    if base_slug = any(array['new','edit','admin','login','signup','settings','pricing','api','www','app','help','support']) then
      base_slug := base_slug || '-menu';
    end if;

    candidate_slug := base_slug;
    slug_suffix := 2;

    while exists (
      select 1
      from public.menus
      where slug = candidate_slug
    ) loop
      candidate_slug := left(base_slug, greatest(1, 60 - length(slug_suffix::text) - 1))
        || '-'
        || slug_suffix::text;
      slug_suffix := slug_suffix + 1;
    end loop;

    update public.menus
    set slug = candidate_slug
    where id = menu_record.id
      and slug is null;
  end loop;
end $$;

create unique index if not exists menus_slug_key
on public.menus (slug);
