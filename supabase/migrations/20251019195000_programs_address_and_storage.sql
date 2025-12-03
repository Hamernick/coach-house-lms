set check_function_bodies = off;
set search_path = public;

-- Address fields for programs
alter table programs add column if not exists address_street text;
alter table programs add column if not exists address_city text;
alter table programs add column if not exists address_state text;
alter table programs add column if not exists address_postal text;
alter table programs add column if not exists address_country text;

-- Storage bucket for program media (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'program-media', 'program-media', true, 20971520, array['image/png','image/jpeg','image/webp','image/svg+xml']::text[]
where not exists (select 1 from storage.buckets where id = 'program-media');

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'program_media_public_read'
  ) then
    execute 'create policy "program_media_public_read" on storage.objects for select to anon, authenticated using (bucket_id = ''program-media'')';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'program_media_insert_own'
  ) then
    execute 'create policy "program_media_insert_own" on storage.objects for insert to authenticated with check (bucket_id = ''program-media'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'program_media_update_own'
  ) then
    execute 'create policy "program_media_update_own" on storage.objects for update to authenticated using (bucket_id = ''program-media'' and split_part(name, ''/'', 1) = auth.uid()::text) with check (bucket_id = ''program-media'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'program_media_delete_own'
  ) then
    execute 'create policy "program_media_delete_own" on storage.objects for delete to authenticated using (bucket_id = ''program-media'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

