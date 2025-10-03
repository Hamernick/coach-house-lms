set check_function_bodies = off;

-- Create public avatars bucket with constraints if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp']::text[]
where not exists (select 1 from storage.buckets where id = 'avatars');

-- Allow public read via the Storage API (public URL access is already enabled by bucket.public)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_public_read'
  ) then
    execute 'create policy "avatars_public_read" on storage.objects for select to anon, authenticated using (bucket_id = ''avatars'')';
  end if;
end $$;

-- Restrict writes to a user's own folder: {auth.uid()}/filename
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_insert_own_folder'
  ) then
    execute 'create policy "avatars_insert_own_folder" on storage.objects for insert to authenticated with check (bucket_id = ''avatars'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_update_own_folder'
  ) then
    execute 'create policy "avatars_update_own_folder" on storage.objects for update to authenticated using (bucket_id = ''avatars'' and split_part(name, ''/'', 1) = auth.uid()::text) with check (bucket_id = ''avatars'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_delete_own_folder'
  ) then
    execute 'create policy "avatars_delete_own_folder" on storage.objects for delete to authenticated using (bucket_id = ''avatars'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;
