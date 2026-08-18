do $$
declare
  store_record record;
  base_slug text;
  candidate_slug text;
  slug_suffix integer;
begin
  drop policy if exists "Users can create QR codes for their menus" on public.menu_qr_codes;
  drop policy if exists "Users can delete QR codes from their menus" on public.menu_qr_codes;
  drop policy if exists "Users can update QR codes from their menus" on public.menu_qr_codes;
  drop policy if exists "Users can view QR codes from their menus" on public.menu_qr_codes;
  drop policy if exists "Users can delete QR codes for their menus" on storage.objects;
  drop policy if exists "Users can update QR codes for their menus" on storage.objects;
  drop policy if exists "Users can upload QR codes for their menus" on storage.objects;
  drop policy if exists "Anyone can view business logos" on storage.objects;
  drop policy if exists "Users can upload business logos" on storage.objects;
  drop policy if exists "Users can update business logos" on storage.objects;
  drop policy if exists "Users can delete business logos" on storage.objects;
  drop policy if exists "Anyone can view menu item images" on storage.objects;
  drop policy if exists "Users can upload menu item images" on storage.objects;
  drop policy if exists "Users can update menu item images" on storage.objects;
  drop policy if exists "Users can delete menu item images" on storage.objects;

  drop policy if exists "Users can create categories for their menus" on public.menu_categories;
  drop policy if exists "Users can delete categories from their menus" on public.menu_categories;
  drop policy if exists "Users can read categories from their menus" on public.menu_categories;
  drop policy if exists "Users can update categories from their menus" on public.menu_categories;

  drop policy if exists "Users can create items for their menu categories" on public.menu_category_items;
  drop policy if exists "Users can delete items from their menu categories" on public.menu_category_items;
  drop policy if exists "Users can view items from their menu categories" on public.menu_category_items;
  drop policy if exists "Users can update items from their menu categories" on public.menu_category_items;

  drop policy if exists "Users can create sort indexes for their menus" on public.menu_category_sort_indexes;
  drop policy if exists "Users can delete sort indexes from their menus" on public.menu_category_sort_indexes;
  drop policy if exists "Users can view sort indexes from their menus" on public.menu_category_sort_indexes;
  drop policy if exists "Users can update sort indexes from their menus" on public.menu_category_sort_indexes;

  drop policy if exists "Users can create item sort indexes for their categories" on public.menu_category_item_sort_indexes;
  drop policy if exists "Users can delete item sort indexes from their categories" on public.menu_category_item_sort_indexes;
  drop policy if exists "Users can view item sort indexes from their categories" on public.menu_category_item_sort_indexes;
  drop policy if exists "Users can update item sort indexes from their categories" on public.menu_category_item_sort_indexes;

  drop policy if exists "Users can create menus for their own businesses" on public.menus;
  drop policy if exists "Users can delete menus for their own businesses" on public.menus;
  drop policy if exists "Users can update menus for their own businesses" on public.menus;
  drop policy if exists "Users can view menus for their own businesses" on public.menus;

  drop policy if exists "Users can create slug redirects for their menus" on public.menu_slug_redirects;
  drop policy if exists "Users can delete slug redirects for their menus" on public.menu_slug_redirects;
  drop policy if exists "Users can update slug redirects for their menus" on public.menu_slug_redirects;
  drop policy if exists "Users can view slug redirects for their menus" on public.menu_slug_redirects;

  drop policy if exists "Users can read their own subscriptions" on public.subscriptions;

  drop policy if exists "Users can create their own businesses" on public.businesses;
  drop policy if exists "Users can delete their own businesses" on public.businesses;
  drop policy if exists "Users can update their own businesses" on public.businesses;
  drop policy if exists "Users can view their own businesses" on public.businesses;
exception
  when undefined_table then
    null;
end
$$;

drop trigger if exists enforce_menus_slug_ref_uniqueness on public.menus;
drop trigger if exists enforce_menu_slug_redirects_ref_uniqueness on public.menu_slug_redirects;
drop function if exists public.update_menu_settings(uuid, text, text);
drop function if exists public.enforce_menu_slug_ref_uniqueness();

alter table if exists public.businesses rename to stores;

update storage.buckets
set id = 'store_logos',
    name = 'store_logos'
where id = 'business_logos';

update storage.objects
set bucket_id = 'store_logos',
    name = regexp_replace(name, '^business/', 'store/')
where bucket_id = 'business_logos';

alter table public.stores
  add column if not exists slug text;

do $$
declare
  store_record record;
  base_slug text;
  candidate_slug text;
  slug_suffix integer;
begin
  for store_record in
    select id, name
    from public.stores
    where slug is null
    order by created_at, id
  loop
    base_slug := lower(trim(coalesce(store_record.name, '')));
    base_slug := regexp_replace(base_slug, '[''""’]+', '', 'g');
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');
    base_slug := left(base_slug, 60);
    base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');

    if base_slug = '' then
      base_slug := 'store';
    end if;

    if base_slug = any(array['new','edit','admin','login','signup','settings','pricing','api','www','app','help','support']) then
      base_slug := base_slug || '-store';
    end if;

    candidate_slug := base_slug;
    slug_suffix := 2;

    while exists (
      select 1
      from public.stores
      where slug = candidate_slug
        and id <> store_record.id
    ) loop
      candidate_slug := left(base_slug, greatest(1, 60 - length(slug_suffix::text) - 1))
        || '-'
        || slug_suffix::text;
      slug_suffix := slug_suffix + 1;
    end loop;

    update public.stores
    set slug = candidate_slug
    where id = store_record.id;
  end loop;
end
$$;

alter table public.stores
  alter column slug set not null;

alter table public.stores
  drop constraint if exists stores_slug_format_check;

alter table public.stores
  add constraint stores_slug_format_check
  check (
    length(slug) between 3 and 60
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and slug <> all(array[
      'new',
      'edit',
      'admin',
      'login',
      'signup',
      'settings',
      'pricing',
      'api',
      'www',
      'app',
      'help',
      'support'
    ])
  );

drop index if exists public.menus_slug_key;
create unique index if not exists stores_slug_key on public.stores (slug);

alter table if exists public.menu_categories rename to store_categories;
alter table if exists public.menu_category_items rename to store_category_items;
alter table if exists public.menu_category_sort_indexes rename to store_category_sort_indexes;
alter table if exists public.menu_category_item_sort_indexes rename to store_category_item_sort_indexes;
alter table if exists public.menu_qr_codes rename to store_qr_codes;

alter table public.store_categories add column if not exists store_id uuid;
update public.store_categories sc
set store_id = m.business_id
from public.menus m
where sc.menu_id = m.id
  and sc.store_id is null;
alter table public.store_categories alter column store_id set not null;
alter table public.store_categories drop constraint if exists menu_categories_menu_id_fkey;
alter table public.store_categories drop column if exists menu_id;

alter table public.store_category_items add column if not exists store_id uuid;
update public.store_category_items sci
set store_id = m.business_id
from public.menus m
where sci.menu_id = m.id
  and sci.store_id is null;
alter table public.store_category_items alter column store_id set not null;
alter table public.store_category_items drop constraint if exists menu_category_items_menu_id_fkey;
alter table public.store_category_items drop column if exists menu_id;
alter table public.store_category_items rename column menu_category_id to store_category_id;

alter table public.store_category_sort_indexes add column if not exists store_id uuid;
update public.store_category_sort_indexes scsi
set store_id = m.business_id
from public.menus m
where scsi.menu_id = m.id
  and scsi.store_id is null;
alter table public.store_category_sort_indexes alter column store_id set not null;
alter table public.store_category_sort_indexes drop constraint if exists menu_category_sort_indexes_menu_id_fkey;
alter table public.store_category_sort_indexes drop column if exists menu_id;

alter table public.store_category_item_sort_indexes rename column menu_category_id to store_category_id;
alter table public.store_category_item_sort_indexes rename column menu_category_item_id to store_category_item_id;

alter table public.store_qr_codes add column if not exists store_id uuid;
update public.store_qr_codes sqc
set store_id = m.business_id
from public.menus m
where sqc.menu_id = m.id
  and sqc.store_id is null;
alter table public.store_qr_codes alter column store_id set not null;
alter table public.store_qr_codes drop constraint if exists menu_qr_codes_menu_id_fkey;
alter table public.store_qr_codes drop column if exists menu_id;

alter table public.subscriptions add column if not exists store_id uuid;
update public.subscriptions s
set store_id = m.business_id
from public.menus m
where s.menu_id = m.id
  and s.store_id is null;
alter table public.subscriptions alter column store_id set not null;
alter table public.subscriptions drop constraint if exists subscriptions_menu_id_key;
alter table public.subscriptions drop constraint if exists subscriptions_menu_id_fkey;
alter table public.subscriptions drop column if exists menu_id;
alter table public.subscriptions add constraint subscriptions_store_id_key unique (store_id);

drop table if exists public.menu_slug_redirects;
drop table if exists public.menus;

alter table public.store_categories
  add constraint store_categories_store_id_fkey
  foreign key (store_id) references public.stores(id)
  on update cascade on delete cascade;

alter table public.store_category_items
  add constraint store_category_items_store_id_fkey
  foreign key (store_id) references public.stores(id)
  on update cascade on delete cascade;

alter table public.store_category_items
  add constraint store_category_items_store_category_id_fkey
  foreign key (store_category_id) references public.store_categories(id)
  on update cascade on delete cascade;

alter table public.store_category_sort_indexes
  add constraint store_category_sort_indexes_store_id_fkey
  foreign key (store_id) references public.stores(id)
  on update cascade on delete cascade;

alter table public.store_category_sort_indexes
  add constraint store_category_sort_indexes_category_id_fkey
  foreign key (category_id) references public.store_categories(id)
  on update cascade on delete cascade;

alter table public.store_category_item_sort_indexes
  add constraint store_category_item_sort_indexes_store_category_id_fkey
  foreign key (store_category_id) references public.store_categories(id)
  on update cascade on delete cascade;

alter table public.store_category_item_sort_indexes
  add constraint store_category_item_sort_indexes_store_category_item_id_fkey
  foreign key (store_category_item_id) references public.store_category_items(id)
  on update cascade on delete cascade;

alter table public.store_qr_codes
  add constraint store_qr_codes_store_id_fkey
  foreign key (store_id) references public.stores(id)
  on update cascade on delete cascade;

alter table public.subscriptions
  add constraint subscriptions_store_id_fkey
  foreign key (store_id) references public.stores(id)
  on update cascade on delete restrict;

create policy "Users can create their own stores"
on public.stores
for insert
with check (user_id = auth.uid());

create policy "Users can delete their own stores"
on public.stores
for delete
using (user_id = auth.uid());

create policy "Users can update their own stores"
on public.stores
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can view their own stores"
on public.stores
for select
using (user_id = auth.uid());

create policy "Users can create QR codes for their stores"
on public.store_qr_codes
for insert
with check (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can view QR codes for their stores"
on public.store_qr_codes
for select
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can update QR codes for their stores"
on public.store_qr_codes
for update
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
)
with check (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can delete QR codes for their stores"
on public.store_qr_codes
for delete
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can create categories for their stores"
on public.store_categories
for insert
with check (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can read categories for their stores"
on public.store_categories
for select
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can update categories for their stores"
on public.store_categories
for update
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
)
with check (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can delete categories for their stores"
on public.store_categories
for delete
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can create items for their stores"
on public.store_category_items
for insert
with check (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can view items for their stores"
on public.store_category_items
for select
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can update items for their stores"
on public.store_category_items
for update
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
)
with check (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can delete items for their stores"
on public.store_category_items
for delete
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can create sort indexes for their stores"
on public.store_category_sort_indexes
for insert
with check (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can view sort indexes for their stores"
on public.store_category_sort_indexes
for select
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can update sort indexes for their stores"
on public.store_category_sort_indexes
for update
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
)
with check (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can delete sort indexes for their stores"
on public.store_category_sort_indexes
for delete
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can create item sort indexes for their stores"
on public.store_category_item_sort_indexes
for insert
with check (
  store_category_id in (
    select sc.id
    from public.store_categories sc
    join public.stores s on s.id = sc.store_id
    where s.user_id = auth.uid()
  )
);

create policy "Users can view item sort indexes for their stores"
on public.store_category_item_sort_indexes
for select
using (
  store_category_id in (
    select sc.id
    from public.store_categories sc
    join public.stores s on s.id = sc.store_id
    where s.user_id = auth.uid()
  )
);

create policy "Users can update item sort indexes for their stores"
on public.store_category_item_sort_indexes
for update
using (
  store_category_id in (
    select sc.id
    from public.store_categories sc
    join public.stores s on s.id = sc.store_id
    where s.user_id = auth.uid()
  )
)
with check (
  store_category_id in (
    select sc.id
    from public.store_categories sc
    join public.stores s on s.id = sc.store_id
    where s.user_id = auth.uid()
  )
);

create policy "Users can delete item sort indexes for their stores"
on public.store_category_item_sort_indexes
for delete
using (
  store_category_id in (
    select sc.id
    from public.store_categories sc
    join public.stores s on s.id = sc.store_id
    where s.user_id = auth.uid()
  )
);

create policy "Users can read their own subscriptions"
on public.subscriptions
for select
using (
  store_id in (
    select s.id
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Anyone can view store logos"
on storage.objects
as permissive
for select
to public
using (bucket_id = 'store_logos'::text);

create policy "Users can upload store logos"
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'store_logos'::text
  and (storage.foldername(name))[1] = 'store'::text
  and (storage.foldername(name))[2] in (
    select s.id::text
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can update store logos"
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'store_logos'::text
  and (storage.foldername(name))[1] = 'store'::text
  and (storage.foldername(name))[2] in (
    select s.id::text
    from public.stores s
    where s.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'store_logos'::text
  and (storage.foldername(name))[1] = 'store'::text
  and (storage.foldername(name))[2] in (
    select s.id::text
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can delete store logos"
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'store_logos'::text
  and (storage.foldername(name))[1] = 'store'::text
  and (storage.foldername(name))[2] in (
    select s.id::text
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Anyone can view store item images"
on storage.objects
as permissive
for select
to public
using (bucket_id = 'store_item_images'::text);

create policy "Users can upload store item images"
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'store_item_images'::text
  and (storage.foldername(name))[1] = 'store'::text
  and (storage.foldername(name))[2] in (
    select s.id::text
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can update store item images"
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'store_item_images'::text
  and (storage.foldername(name))[1] = 'store'::text
  and (storage.foldername(name))[2] in (
    select s.id::text
    from public.stores s
    where s.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'store_item_images'::text
  and (storage.foldername(name))[1] = 'store'::text
  and (storage.foldername(name))[2] in (
    select s.id::text
    from public.stores s
    where s.user_id = auth.uid()
  )
);

create policy "Users can delete store item images"
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'store_item_images'::text
  and (storage.foldername(name))[1] = 'store'::text
  and (storage.foldername(name))[2] in (
    select s.id::text
    from public.stores s
    where s.user_id = auth.uid()
  )
);

comment on table public.stores is 'Stores managed by users.';
comment on table public.subscriptions is 'Subscriptions for each store, determining if that store food page is public.';
