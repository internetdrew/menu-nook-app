alter table public.menu_category_items
add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('menu_item_images', 'menu_item_images', true)
on conflict (id) do nothing;

create policy "Anyone can view menu item images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'menu_item_images'::text));

create policy "Users can upload menu item images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (
  (bucket_id = 'menu_item_images'::text)
  and ((storage.foldername(name))[1] = 'menu'::text)
  and ((storage.foldername(name))[2] in (
    select m.id::text
    from public.menus m
    join public.businesses b on b.id = m.business_id
    where b.user_id = auth.uid()
  ))
);

create policy "Users can update menu item images"
on "storage"."objects"
as permissive
for update
to authenticated
using (
  (bucket_id = 'menu_item_images'::text)
  and ((storage.foldername(name))[1] = 'menu'::text)
  and ((storage.foldername(name))[2] in (
    select m.id::text
    from public.menus m
    join public.businesses b on b.id = m.business_id
    where b.user_id = auth.uid()
  ))
)
with check (
  (bucket_id = 'menu_item_images'::text)
  and ((storage.foldername(name))[1] = 'menu'::text)
  and ((storage.foldername(name))[2] in (
    select m.id::text
    from public.menus m
    join public.businesses b on b.id = m.business_id
    where b.user_id = auth.uid()
  ))
);

create policy "Users can delete menu item images"
on "storage"."objects"
as permissive
for delete
to authenticated
using (
  (bucket_id = 'menu_item_images'::text)
  and ((storage.foldername(name))[1] = 'menu'::text)
  and ((storage.foldername(name))[2] in (
    select m.id::text
    from public.menus m
    join public.businesses b on b.id = m.business_id
    where b.user_id = auth.uid()
  ))
);
