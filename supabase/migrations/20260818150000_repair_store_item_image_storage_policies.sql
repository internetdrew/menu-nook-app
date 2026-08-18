update storage.objects
set bucket_id = 'store_item_images'
where bucket_id = 'menu_item_images';

update storage.buckets
set id = 'store_item_images',
    name = 'store_item_images'
where id = 'menu_item_images'
  and not exists (
    select 1
    from storage.buckets
    where id = 'store_item_images'
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'store_item_images',
  'store_item_images',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view menu item images" on storage.objects;
drop policy if exists "Users can upload menu item images" on storage.objects;
drop policy if exists "Users can update menu item images" on storage.objects;
drop policy if exists "Users can delete menu item images" on storage.objects;
drop policy if exists "Anyone can view store item images" on storage.objects;
drop policy if exists "Users can upload store item images" on storage.objects;
drop policy if exists "Users can update store item images" on storage.objects;
drop policy if exists "Users can delete store item images" on storage.objects;

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
