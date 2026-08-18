drop trigger if exists enforce_store_menu_slug_redirects_ref_uniqueness on public.store_menu_slug_redirects;
drop trigger if exists enforce_stores_menu_slug_ref_uniqueness on public.stores;
drop function if exists public.enforce_store_menu_slug_ref_uniqueness();
drop table if exists public.store_menu_slug_redirects;

create or replace function public.prevent_store_menu_slug_update()
returns trigger
language plpgsql
as $$
begin
  if old.menu_slug is distinct from new.menu_slug then
    raise exception 'Public store links cannot be changed after creation.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_store_menu_slug_update on public.stores;
create trigger prevent_store_menu_slug_update
before update of menu_slug on public.stores
for each row
execute function public.prevent_store_menu_slug_update();
