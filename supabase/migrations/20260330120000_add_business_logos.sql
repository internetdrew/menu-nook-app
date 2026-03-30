alter table "public"."businesses"
add column "image_url" text,
add column "image_path" text;

insert into storage.buckets (id, name, public)
values ('business_logos', 'business_logos', true)
on conflict (id) do nothing;

create policy "Anyone can view business logos"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'business_logos'::text));

create policy "Users can upload business logos"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (
  (bucket_id = 'business_logos'::text)
  and ((storage.foldername(name))[1] = 'business'::text)
  and ((storage.foldername(name))[2] in (
    select (b.id)::text
    from public.businesses b
    where b.user_id = auth.uid()
  ))
);

create policy "Users can update business logos"
on "storage"."objects"
as permissive
for update
to authenticated
using (
  (bucket_id = 'business_logos'::text)
  and ((storage.foldername(name))[1] = 'business'::text)
  and ((storage.foldername(name))[2] in (
    select (b.id)::text
    from public.businesses b
    where b.user_id = auth.uid()
  ))
)
with check (
  (bucket_id = 'business_logos'::text)
  and ((storage.foldername(name))[1] = 'business'::text)
  and ((storage.foldername(name))[2] in (
    select (b.id)::text
    from public.businesses b
    where b.user_id = auth.uid()
  ))
);

create policy "Users can delete business logos"
on "storage"."objects"
as permissive
for delete
to authenticated
using (
  (bucket_id = 'business_logos'::text)
  and ((storage.foldername(name))[1] = 'business'::text)
  and ((storage.foldername(name))[2] in (
    select (b.id)::text
    from public.businesses b
    where b.user_id = auth.uid()
  ))
);
